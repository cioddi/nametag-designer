import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo
} from 'react';
import PropTypes from 'prop-types';

const JscadContext = React.createContext({});
const AppStateProvider = JscadContext.Provider;

const JscadContextProvider = ({ children }) => {
  const [state, setState] = useState({});
  const stateRef = useRef(state);

  useEffect(() => {
    //console.log('CONTEXT ' + JSON.stringify(state));
  }, [state]);

  const value = {
    state,
    setState,
    stateRef
  };

  return <AppStateProvider value={value}>{children}</AppStateProvider>;
};

JscadContextProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export { JscadContext, JscadContextProvider };
