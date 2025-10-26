import React, { useMemo, useState, useContext } from 'react';
import { JscadContext } from '../components/JscadContext';
import { parseElementConfig } from './elementFactory';
import { Grid, Button, Paper } from '@material-ui/core';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import CancelIcon from '@material-ui/icons/Cancel';

function List(props) {
  const [cnt, setCnt] = useState(1);
  const jscadContext = useContext(JscadContext);
  const elements = useMemo(() => {
    let elements = [];

    for (let i = 0; i < cnt; i++) {
      let tmpElements = props.field_cfg.elements.map(cfg => {
        let tmpCfg = { ...cfg };
        tmpCfg.name = props.field_cfg.name + '_' + tmpCfg.name + '_' + i;
        return parseElementConfig(tmpCfg);
      });

      let currentId = parseInt(i + '');

      elements.push(
        <Paper
          key={props.field_cfg.name + '_' + i}
          style={{ marginBottom: '5px', padding: '8px' }}>
          <Grid
            container
            spacing={2}
            style={{ paddingTop: currentId === 0 ? '10px' : 0 }}>
            {currentId > 0 && (
              <Grid
                item
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  width: '100%',
                  paddingBottom: 0
                }}>
                <Button
                  onClick={() => {
                    removeItem(currentId);
                  }}
                  size="small"
                  disabled={cnt <= 1}>
                  <CancelIcon />
                </Button>
              </Grid>
            )}
            {tmpElements}
          </Grid>
        </Paper>
      );
    }
    return elements;
  }, [cnt, props]);

  const removeItem = itemId => {
    console.log(itemId);

    let data = { ...jscadContext.stateRef.current };

    // remove all elements where id==itemId
    for (let i = 0, len = props.field_cfg.elements.length; i < len; i++) {
      let tmpCfg = props.field_cfg.elements[i];
      delete data[props.field_cfg.name + '_' + tmpCfg.name + '_' + itemId];

      //move all elements with >itemId one down
      let currentItemId = itemId + 1;
      while (
        typeof data[
          props.field_cfg.name + '_' + tmpCfg.name + '_' + currentItemId
        ] !== 'undefined'
      ) {
        data[
          props.field_cfg.name + '_' + tmpCfg.name + '_' + (currentItemId - 1)
        ] =
          data[props.field_cfg.name + '_' + tmpCfg.name + '_' + currentItemId];
        currentItemId++;
      }
    }

    jscadContext.stateRef.current = data;
    jscadContext.setState(data);

    setCnt(cnt - 1);
  };

  return (
    <div>
      <Button onClick={() => setCnt(cnt + 1)}>
        <AddCircleOutlineIcon />
        &nbsp; {props.field_cfg.name}
      </Button>
      {elements}
    </div>
  );
}

export default List;
