import * as React from "react";
import * as moment from "moment";
import styled from "styled-components";
import PivotContentContainer from "../PivotContentContainer";
import List from "../List";
import { Checkbox } from "office-ui-fabric-react/lib/Checkbox";
import { Icon } from "office-ui-fabric-react/lib/Icon";
import {
  getElapsedTime,
  getNumberFromLocalStorage,
  setUpMomentJsDurationDefaults
} from "../../../../app/helpers";
import { getDisplayLanguage } from "../../../../app/strings";
const { localStorageKeys } = PLAYGROUND;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  padding: 8px;
  height: 48px;
  background: #f4f4f4;
  box-sizing: border-box;
`;

const CheckboxWrapper = styled.div`
  height: 38px;
  background: #f4f4f4;
  box-sizing: border-box;
  padding: 9px;
`;

const LogsWrapper = styled.div`
  height: 100%;
  overflow: auto;
  flex-shrink: 2;
`;

const ClearButton = styled.button`
  width: 20px;
  height: 20px;
  background: none;
  border: 0px;
  position: relative;
  margin-right: 13px;
  margin-left: 5px;

  &:hover {
    color: #b22222;
    cursor: pointer;
  }

  &:active {
    color: red;
  }

  &:focus {
    outline: none;
  }
`;

export interface Props {}

export interface State {
  filterQuery: string;
  shouldScrollToBottom: boolean;
  logs: string[];
  runnerLastUpdatedText?: string;
  runnerIsAlive?: boolean;
}

export default class Console extends React.Component<Props, State> {
  private interval;
  constructor(props: Props) {
    super(props);

    setUpMomentJsDurationDefaults(moment);
    this.state = { filterQuery: "", shouldScrollToBottom: true, logs: [] };
  }

  getLogs() {
    const runnerIsAlive =
      getElapsedTime(
        getNumberFromLocalStorage(
          localStorageKeys.customFunctionsLastHeartbeatTimestamp
        )
      ) < 3000;

    this.setState({
      runnerIsAlive
    });

    if (runnerIsAlive) {
      const runnerLastUpdatedText = moment(
        new Date(
          getNumberFromLocalStorage(
            localStorageKeys.customFunctionsCurrentlyRunningTimestamp
          )
        )
      )
        .locale(getDisplayLanguage())
        .fromNow();
      this.setState({ runnerLastUpdatedText });
    } else {
      this.setState({ runnerLastUpdatedText: null });
    }

    const storageLogs = window.localStorage.getItem(localStorageKeys.log) || "";
    const logs = storageLogs
      .split("\n")
      .filter(line => line !== "")
      .filter(line => !line.includes("Agave.HostCall"))
      .map(entry => JSON.parse(entry))
      .map(log => {
        return log.message;
      });

    if (logs.length !== this.state.logs.length) {
      this.scrollToBottom();
      this.setState({ logs });
    }
  }

  componentDidMount() {
    this.scrollToBottom();

    this.interval = setInterval(() => this.getLogs(), 250);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  componentDidUpdate() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.state.shouldScrollToBottom) {
      (this.refs.lastLog as any).scrollIntoView();
    }
  }

  updateFilterQuery = () =>
    this.setState({
      filterQuery: (this.refs.filterTextInput as any).value.toLowerCase()
      // tslint:disable-next-line:semicolon
    });

  clearLogs = () => {
    window.localStorage.removeItem(localStorageKeys.log);
    this.setState({ logs: [] });
    // tslint:disable-next-line:semicolon
  };

  setShouldScrollToBottom = (
    ev: React.FormEvent<HTMLElement>,
    checked: boolean
  ) =>
    this.setState({
      shouldScrollToBottom: checked
      // tslint:disable-next-line:semicolon
    });

  render() {
    const items = this.state.logs
      .filter(log => log.toLowerCase().includes(this.state.filterQuery))
      .map((log, i) => ({ name: log, key: i }));

    const runnerLastUpdatedStyle = {
      padding: "8px 12px",
      display: this.state.runnerLastUpdatedText ? "block" : "none",
      color: this.state.runnerIsAlive ? "darkgreen" : "darkred"
    };
    return (
      <PivotContentContainer>
        <div style={runnerLastUpdatedStyle}>
          Runner last updated {this.state.runnerLastUpdatedText}
        </div>
        <FilterWrapper>
          <ClearButton onClick={this.clearLogs}>
            <Icon
              style={{
                position: "absolute",
                top: "0px",
                bottom: "0px",
                left: "0px",
                right: "0px",
                width: "20px",
                height: "20px",
                lineHeight: "20px"
              }}
              iconName="Clear"
            />
          </ClearButton>
          <input
            className="ms-font-m"
            type="text"
            placeholder="Filter"
            onChange={this.updateFilterQuery}
            ref="filterTextInput"
            style={{
              width: "100%",
              height: "32px",
              padding: "6px",
              boxSizing: "border-box"
            }}
          />
        </FilterWrapper>
        <LogsWrapper>
          <List items={items} />
          <div ref="lastLog" />
        </LogsWrapper>
        <CheckboxWrapper>
          <Checkbox
            label="Auto-scroll"
            defaultChecked={true}
            onChange={this.setShouldScrollToBottom}
          />
        </CheckboxWrapper>
      </PivotContentContainer>
    );
  }
}