import React, { useState, useContext, useEffect } from 'react';
import { JscadContext } from '../components/JscadContext';
import { TextField, InputAdornment } from '@material-ui/core';

function NumberField(props) {
  const jscadContext = useContext(JscadContext);

  useEffect(() => {
    let tmpState = { ...jscadContext.stateRef.current };
    tmpState[props.field_cfg.name] = props.field_cfg.default;
    jscadContext.stateRef.current = tmpState;
    jscadContext.setState(tmpState);
  }, []);

  const onChange = (ev, value) => {
    let data = { ...jscadContext.stateRef.current };

    if (typeof ev.target !== 'undefined') {
      data[ev.target.name] = parseInt(ev.target.value);
      if (isNaN(data[ev.target.name])) {
        data[ev.target.name] = 1;
      }
    }
    jscadContext.stateRef.current = data;
    jscadContext.setState(data);
  };

  return (
    <TextField
      {...(({ name, label }) => ({ name, label }))(props.field_cfg)}
      type="number"
      value={jscadContext.state[props.field_cfg.name] || 0}
      onChange={onChange}
      {...{
        InputProps: props.field_cfg.unit
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  {props.field_cfg.unit}
                </InputAdornment>
              )
            }
          : null
      }}
    />
  );
}

export default NumberField;
