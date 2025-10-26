import React, { useMemo, useEffect, useState, useContext } from 'react';
import { JscadContext } from '../components/JscadContext';
import { TextField as MuiTextField } from '@material-ui/core';

function TextField(props) {
  const jscadContext = useContext(JscadContext);

  useEffect(() => {
    let tmpState = { ...jscadContext.stateRef.current };
    tmpState[props.field_cfg.name] = props.field_cfg.default;
    jscadContext.stateRef.current = tmpState;
    jscadContext.setState(tmpState);

    return () => {
      delete jscadContext.stateRef.current[props.field_cfg.name];
      jscadContext.setState(jscadContext.stateRef.current);
    };
  }, []);

  const onChange = (ev, value) => {
    let data = { ...jscadContext.stateRef.current };

    data[ev.target.name] = ev.target.value;
    jscadContext.stateRef.current = data;
    jscadContext.setState(data);
  };

  const show = useMemo(() => {
    if (typeof props.hide !== 'function') {
      return true;
    }
    return !props.hide(jscadContext.state);
  }, [jscadContext.state, props.hide]);

  return (
    <>
      {show && (
        <MuiTextField
          {...(({ name, label }) => ({ name, label }))(props.field_cfg)}
          onChange={onChange}
          value={jscadContext.state[props.field_cfg.name]}
        />
      )}
    </>
  );
}

export default TextField;
