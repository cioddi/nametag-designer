import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { Grid, Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  content: {
    paddingTop: 30,
    textAlign: 'left',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
}));

const Imprint = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={4}>
        <Grid item lg={6} xs={12}>
          <div className={classes.content}>
            <Typography variant="h1">Imprint</Typography>
            <Typography variant="p">
              <b>Legal Disclosure</b>
              <br />
              <br />
              Information in accordance with Section 5 TMG
              <br />
              <br />
              Tobias Weber
              <br />
              Eltviller Str. 4
              <br />
              53175 Bonn
              <br />
              <br />
              Contact Information
              <br />
              E-Mail: service@nametag-designer.com
              <br />
              Internet address: www.nametag-designer.com
              <br />
              VAT indentification number in accorance with Section 27 a of the
              German VAT act
              <br />
              Ust ID (VAT): DE309 785 250
              <br />
              <br />
              <b>Disclaimer</b>
              <br />
              Please refer to our <a href="/tos">Terms of service</a>.
            </Typography>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Imprint;
