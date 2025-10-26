import React from 'react';
import List from './List';
import TextField from './TextField';
import NumberField from './NumberField';
import TextNFont from './TextNFont';
import RadioButtons from './RadioButtons';
import FontPicker from './FontPicker/FontPicker';
import { Grid } from '@material-ui/core';

const createDefaultProps = field_cfg => {
  return {
    id: 'jsConfigControl_' + field_cfg.name,
    name: field_cfg.name,
    label:
      typeof field_cfg.label !== 'undefined' ? field_cfg.label : field_cfg.name,
    style: { width: '100%' },
    ...field_cfg
  };
};

const parseElementConfig = field_cfg => {
  if (typeof field_cfg.default === 'undefined') {
    field_cfg.default = '';
  }

  var grid_cfg = {
    xs: 12,
    sm: 12,
    lg: 12,
    xl: 12
  };

  let default_props = createDefaultProps(field_cfg);

  var formfield = <TextField field_cfg={default_props} />;

  //determine field type
  switch (field_cfg.type) {
    case 'textnfont':
      default_props = {};
      default_props.textfield = createDefaultProps(field_cfg.textfield);
      default_props.fontpicker = createDefaultProps(field_cfg.fontpicker);
      formfield = <TextNFont {...default_props} />;
      break;
    case 'integer':
      grid_cfg = {
        xs: 6,
        sm: 3,
        lg: 3,
        xl: 2
      };
      formfield = <NumberField field_cfg={default_props} />;
      break;
    case 'font':
      //console.log(default_props);
      formfield = <FontPicker field_cfg={default_props} />;
      break;
    case 'list':
      //console.log(default_props);
      formfield = <List field_cfg={default_props} />;
      break;
    case 'radio':
      //console.log(default_props);
      formfield = <RadioButtons field_cfg={default_props} />;
      break;
    case 'string':
    default:
      formfield = <TextField field_cfg={default_props} />;
      break;
  }
  var output = [];

  output.push(
    <Grid
      item
      {...grid_cfg}
      key={'jscadFormControl_item_' + field_cfg.name}
      style={{ paddingTop: 0 }}>
      {formfield}
    </Grid>
  );

  return output;
};

export { parseElementConfig };
