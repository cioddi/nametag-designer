import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import {
  Grid,
  Typography,
  AppBar,
  Toolbar,
  Badge,
  Hidden,
  IconButton,
  Button
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';
import NotificationsIcon from '@material-ui/icons/NotificationsOutlined';
import InputIcon from '@material-ui/icons/Input';

const useStyles = makeStyles(theme => ({
  root: {
    boxShadow: 'none'
  },
  logotext: {
    color: '#fff',
    fontWeight: 600,
    fontSize: '15px',
    letterSpacing: '-0.06px',
    lineHeight: '28px',
    marginTop: '14px'
  },
  flexGrow: {
    flexGrow: 1
  },
  signOutButton: {
    marginLeft: theme.spacing(1)
  },
  button: {
    fontSize: '13px',
    color: '#fff'
  }
}));

const Topbar = props => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const [notifications] = useState([]);

  return (
    <AppBar {...rest} className={clsx(classes.root, className)}>
      <Toolbar style={{ maxHeight: '46px', minHeight: '46px' }}>
        <RouterLink style={{ minWidth: '250px' }} to="/">
          <Grid container spacing={0}>
            <Grid
              item
              xs={2}
              style={{ paddingTop: 0, display: 'flex', alignItems: 'center' }}>
              <img
                src="/nametag-designer/assets/logo.svg"
                style={{ color: '#fff' }}
                width="35"
              />
            </Grid>
            <Grid
              item
              xs={10}
              style={{ paddingTop: 0, display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="h2"
                component="h2"
                className={classes.logotext}>
                Nametag Designer
              </Typography>
            </Grid>
          </Grid>
        </RouterLink>
        <div className={classes.flexGrow} />
        {/*
        <Button
          target='_blanc'
          href='/tos'
          className={classes.button}
        >
          Terms of service
        </Button>
        <Button
          target='_blanc'
          href='/pp'
          className={classes.button}
        >
					Privacy Policy
        </Button>
        <Button
          target='_blanc'
          href='/cp'
          className={classes.button}
        >
					Cookie Policy
        </Button>
*/}
        <Button target="_blanc" href="/imprint" className={classes.button}>
          Imprint
        </Button>
      </Toolbar>
    </AppBar>
  );
};

Topbar.propTypes = {
  className: PropTypes.string,
  onSidebarOpen: PropTypes.func
};

export default Topbar;
