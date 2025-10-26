import React, { useEffect, useState, useContext } from 'react';

import { makeStyles } from '@material-ui/styles';
import { JscadContext } from '../components/JscadContext';
import { TextField, Button, FormControl, FormLabel } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  selectedButton: {
    backgroundColor: '#4f4f4f !important',
    color: '#fff !important'
  }
}));

function NumberField(props) {
  const jscadContext = useContext(JscadContext);
  const classes = useStyles();

  useEffect(() => {
    //console.log(props);
    let tmpState = { ...jscadContext.stateRef.current };
    tmpState[props.field_cfg.name] = props.field_cfg.default;
    jscadContext.stateRef.current = tmpState;
    jscadContext.setState(tmpState);
  }, []);

  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">
        {props.field_cfg.label ? props.field_cfg.label : props.field_cfg.name}
      </FormLabel>
      <div
        color="default"
        style={{
          marginTop: '6px',
          width: '100%',
          display: 'flex',
          alignItems: 'stretch',
          alignContent: 'stretch',
          flexWrap: 'wrap'
        }}
        aria-label="primary button">
        {props.field_cfg.options.map(option_cfg => {
          let presets = {};
          if (typeof option_cfg.presets !== 'undefined') {
            presets = { ...option_cfg.presets };
          }
          let config_value = {};
          config_value[props.field_cfg.name] = option_cfg.value;
          return (
            <Button
              key={
                'JscadFormControls_Button_group_' +
                props.field_cfg.name +
                '_button_' +
                option_cfg.value
              }
              className={
                jscadContext.state[props.field_cfg.name] === option_cfg.value
                  ? classes.selectedButton
                  : null
              }
              disabled={
                jscadContext.state[props.field_cfg.name] === option_cfg.value
                  ? true
                  : false
              }
              onClick={() => {
                jscadContext.stateRef.current[props.field_cfg.name] =
                  option_cfg.value;
                jscadContext.setState({
                  ...jscadContext.state,
                  ...config_value
                });
              }}
              style={{ marginLeft: 0 }}>
              {typeof option_cfg.icon !== 'undefined'
                ? option_cfg.icon
                : option_cfg.value}
            </Button>
          );
        })}
      </div>
    </FormControl>
  );
}

export default NumberField;
