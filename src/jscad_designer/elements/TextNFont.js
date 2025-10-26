import React, { useContext, useEffect, useState } from 'react';
import FontPicker from './FontPicker/FontPicker';
import { Button, Grid } from '@material-ui/core';
import TextField from './TextField';

function TextNFont(props) {
  useEffect(() => {
    console.log(props);
  }, []);

  return (
    <Grid container>
      <Grid
        item
        grid_cfg={{
          xs: 12
        }}
        key={'jscadFormControl_item_' + props.textfield.name}
        style={{ paddingTop: 0 }}>
        <TextField field_cfg={props.textfield} />
      </Grid>
      <Grid
        item
        grid_cfg={{
          xs: 9,
          sm: 9,
          lg: 9,
          xl: 9
        }}
        key={'jscadFormControl_item_' + props.fontpicker.name}
        style={{ paddingTop: 0 }}>
        <FontPicker field_cfg={props.fontpicker} />
      </Grid>
    </Grid>
  );
}

export default TextNFont;
