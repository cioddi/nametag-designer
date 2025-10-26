import React, { useCallback, useContext, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/styles';
import LoadingIndicator from '../../jscad_designer/components/LoadingIndicator';
import JscadFormControls from '../../jscad_designer/components/JscadFormControls';
import { JscadContext } from '../../jscad_designer/components/JscadContext';
import { getCode, getJscadIncludes, param_def } from './jscad_code.js';

import { Grid, Button, Typography } from '@material-ui/core';
import CheckoutDialogValueForValue from '../../jscad_designer/components/CheckoutDialogValueForValue';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4),
    width: '100%'
  }
}));

var last = +new Date();

const update_throttled = fn => {
  var threshhold = 1000;
  last = +new Date();
  setTimeout(function() {
    if (last && +new Date() > last + threshhold) {
      fn();
    }
  }, threshhold + 5);
};

const Designer = props => {
  const classes = useStyles();

  const [state, setState] = useState({
    checkout_form_open: false,
    processor_state: 1,
    randomFontTrigger: 1
  });
  const jscadContext = useContext(JscadContext);

  const [loading, setLoading] = useState(false);
  const [processor, setProcessor] = useState(false);

  const getParams = useCallback(() => {
    return {
      ...jscadContext.state,
      param_def: param_def,
      includes: getJscadIncludes(jscadContext.state)
    };
  }, [jscadContext.state]);

  useEffect(() => {
    let processor = document.init_openjscad('openjscad_designer_viewer');

    window.ojs_processor = processor;
    processor.onchange = () => {
      setState({ ...state, processor_state: processor.getState() });
    };

    setProcessor(processor);

    //setTimeout(() => {processor.viewer.handleResize()},2000);
  }, []);

  const getJscad = () => {
    var script = getCode.toString();
    return script
      .substring(0, script.lastIndexOf('}'))
      .substring(script.indexOf('{') + 1);
  };

  const getStlAsString = cb => {
    processor.clearOutputFile();
    var blob = processor.currentObjectsToBlob();
    var extension = processor.selectedFormatInfo().extension;

    const reader = new FileReader();

    reader.addEventListener('loadend', e => {
      const data = e.srcElement.result;

      cb(data);
    });

    reader.readAsText(blob);
  };

  const update = useCallback(() => {
    if (processor && typeof getParams().textblock_font_0 !== 'undefined') {
      processor.abort();
      //console.log('context ' + JSON.stringify(getParams()));
      processor.setJsCad(getJscad(), 'filename', getParams());
    }
  }, [jscadContext.state]);

  useEffect(() => {
    //if(processor)processor.viewer.handleResize()
    update_throttled(update);
  }, [jscadContext.state]);

  return (
    <div className={classes.root}>
      {loading && <LoadingIndicator />}
      <Grid container spacing={4}>
        <Grid item lg={4} md={4} xl={4} xs={12}>
          <Button
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                setState(state => ({ ...state, checkout_form_open: true }));
              }, 100);
            }}
            style={{ width: '100%' }}
            variant="contained"
            disabled={state.processor_state !== 2}>
            <Typography
              variant="h3"
              component="p"
              style={{ marginRight: '5px' }}>
              Download STL file
            </Typography>
          </Button>
          <br />
          <br />
          <JscadFormControls
            match={props.match}
            processor={processor}
            processor_state={state.processor_state}
            param_def={param_def}
          />
          <Grid
            container
            spacing={4}
            key={'nametag_checkout_info'}
            style={{ marginTop: '16px' }}>
            {/*
            <Grid
              item
              xs={12}

            >
              <Alert severity="info" style={{fontSize:'.9em', fontWeight:'bold'}} >Use coupon code "BETA_02_2020" for FREE nametags.</Alert>
            </Grid>
            */}
            <Grid item xs={12}></Grid>
          </Grid>
          <Grid
            item
            lg={12}
            md={12}
            xl={12}
            xs={12}
            style={{ marginTop: '15px', fontSize: '.7em' }}></Grid>
        </Grid>
        <Grid
          item
          lg={8}
          md={8}
          xl={8}
          xs={12}
          style={{
            maxWidth: '100%',
            position: 'relative'
          }}>
          <div id="header" style={{ display: 'none' }}>
            <div id="errordiv"></div>
          </div>

          {state.processor_state !== 2 && <LoadingIndicator />}

          <div
            style={{ width: '100%' }}
            onContextMenu={() => false}
            id="openjscad_designer_viewer"></div>

          <div id="tail" style={{ display: 'none' }}>
            <div id="statusdiv"></div>
          </div>
        </Grid>
        <Grid
          item
          xs={12}
          style={{
            maxWidth: '100%',
            position: 'relative',
            fontSize: '.7em'
          }}>
          known from
          <a
            target="_blank"
            href="https://hackaday.com/2020/02/22/3d-printable-nameplates-from-your-web-browser/">
            <img width="200" src="/nametag-designer/images/hackaday_logo.png" />
          </a>
          <br />
          <br />
          <h3>Changelog:</h3>
          <ul>
            <li>
              <strong>18.07.2021:</strong>
              <ul>
                <li>Add toggle line break button</li>
                <li>Add functionality to create multiple lines of text</li>
                <li>Refactor react code</li>
                <li>Fix random font button</li>
              </ul>
            </li>
            <li>
              <strong>31.07.2020:</strong>
              <ul>
                <li>
                  Add language selection to font picker, to make it easier to
                  find fonts that support your character set.
                </li>
              </ul>
            </li>
            <li>
              <strong>21.07.2020:</strong>
              <ul>
                <li>New Addon: Hole (Keychain)</li>
              </ul>
            </li>
            <li>
              <strong>21.06.2020:</strong>
              <ul>
                <li>Fixed (some) font rendering issues</li>
                <li>
                  Included missing fonts from google fonts (now featuring the
                  full directory)
                </li>
              </ul>
            </li>
          </ul>
        </Grid>
      </Grid>
      {state.checkout_form_open && (
        <CheckoutDialogValueForValue
          getStlAsString={getStlAsString}
          closeDialog={() => {
            setState({ ...state, checkout_form_open: false });
          }}
          onUploadReady={() => {
            setLoading(false);
          }}
        />
      )}
    </div>
  );
};

export default Designer;
