import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';

import { parseElementConfig } from '../../elements/elementFactory';

import {
  Chip,
  Grid,
  Toolbar,
  Checkbox,
  ButtonGroup,
  Typography,
  Select,
  InputAdornment,
  FormControlLabel,
  Button,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions
} from '@material-ui/core';

//import CheckBoxOutlineBlankRoundedIcon from '@material-ui/icons/CheckBoxOutlineBlankRounded';
import CropSquareRoundedIcon from '@material-ui/icons/CropSquareRounded';
import CheckBoxOutlineBlankSharpIcon from '@material-ui/icons/CheckBoxOutlineBlankSharp';
import PanoramaFishEyeSharpIcon from '@material-ui/icons/PanoramaFishEyeSharp';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import CloseSharpIcon from '@material-ui/icons/CloseSharp';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';

import Icons from '@material-ui/icons';

import env from './../../../env.js';

import namelist from './names.js';

var rFontTrigger = 1;

var nextNameplate = false;

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  }
}));

function JscadFormControls(props) {
  const processor = props.processor;

  const classes = useStyles();

  const [currentFieldset, setCurrentFieldset] = useState(null);

  const downloadStl = (cb, name) => {
    //console.log(processor);
    window.ojs_processor.clearOutputFile();
    var blob = window.ojs_processor.currentObjectsToBlob();
    var extension = window.ojs_processor.selectedFormatInfo().extension;

    function onDone(data, downloadAttribute, blobMode, noData, blob) {
      window.ojs_processor.hasOutputFile = true;
      window.ojs_processor.downloadOutputFileLink.href = data;
      if (blobMode) {
        window.ojs_processor.outputFileBlobUrl = data;
      } else {
        // FIXME: what to do with this one ?
        // that.outputFileDirEntry = dirEntry // save for later removal
      }
      window.ojs_processor.downloadOutputFileLink.innerHTML = window.ojs_processor.downloadLinkTextForCurrentObject();
      window.ojs_processor.downloadOutputFileLink.setAttribute(
        'download',
        name + '.stl'
      );
      if (noData) {
        window.ojs_processor.downloadOutputFileLink.setAttribute(
          'target',
          '_blank'
        );
      }
      window.ojs_processor.enableItems();

      document.getElementsByClassName('downloadOutputFileLink')[0].click();
      cb();
    }

    if (window.ojs_processor.viewedObject) {
      window.ojs_processor._generateOutputFile(
        extension,
        blob,
        onDone,
        window.ojs_processor
      );
      if (window.ojs_processor.ondownload)
        window.ojs_processor.ondownload(window.ojs_processor);
    }
  };

  const selectInitialFieldset = () => {
    for (var i = 0; i < props.param_def.length; i++) {
      if (props.param_def[i].type === 'fieldset') {
        //make first fieldset selected by default
        setCurrentFieldset(props.param_def[i].name);
        break;
      }
    }
  };

  useEffect(() => {
    selectInitialFieldset();
  }, []);

  const renderFieldset = fieldset => {
    let fields = [];

    for (var i = 0; i < fieldset.params.length; i++) {
      fields.push(parseElementConfig(fieldset.params[i]));
    }

    return [
      <Grid
        item
        xs={12}
        style={{
          display: currentFieldset === fieldset.name ? 'block' : 'none'
        }}
        key={'fieldset_' + fieldset.name}>
        <Grid
          container
          spacing={4}
          key={'nametag_config_fieldset_items_' + fieldset.name}>
          {fields}
        </Grid>
      </Grid>
    ];
  };

  const renderControls = () => {
    let fieldset_tabs = [];

    let fields = [];

    for (var i = 0; i < props.param_def.length; i++) {
      if (props.param_def[i].type === 'fieldset') {
        fields = [...fields, ...renderFieldset(props.param_def[i])];

        let isActive = currentFieldset === props.param_def[i].name;
        let current_name = props.param_def[i].name;

        fieldset_tabs.push(
          <Button
            key={'fieldset_tab_button_' + current_name}
            className={isActive ? classes.selectedButton : null}
            disabled={isActive ? true : false}
            startIcon={props.param_def[i].icon}
            style={{ fontSize: '10px' }}
            size="medium"
            onClick={() => {
              setCurrentFieldset(current_name);
            }}>
            {props.param_def[i].label}
          </Button>
        );
      }
    }

    return (
      <div key="jscad_form_controls_container">
        <Grid
          container
          spacing={4}
          key={'nametag_config_fieldset_tabs'}
          style={{ marginBottom: '20px' }}>
          <Grid item xs={12}>
            <ButtonGroup size="large">{fieldset_tabs}</ButtonGroup>
          </Grid>
        </Grid>
        <Grid container spacing={4} key={'nametag_config_fieldsets'}>
          {fields}
        </Grid>
      </div>
    );
  };

  return renderControls();
}

export default JscadFormControls;
