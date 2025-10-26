import React, {Component, useState, useEffect} from 'react';

import LoadingIndicator from "../LoadingIndicator";

//import Calculation from '../../components/Calculation';

import CreditCardIcon from '@material-ui/icons/CreditCard';

import env from './../../../env.js';


import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Radio from '@material-ui/core/Radio';
import Checkbox from '@material-ui/core/Checkbox';

import RadioGroup from '@material-ui/core/RadioGroup';
import IconButton from '@material-ui/core/IconButton';
import GetAppIcon from '@material-ui/icons/GetApp';

import { 
  FormControlLabel,
  FormLabel,
  InputAdornment,
  FormControl,
  Paper,
  Grid,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@material-ui/core';

import Alert from '@material-ui/lab/Alert';


const createOptions = () => {
  return {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'Open Sans, sans-serif',
        letterSpacing: '0.025em',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#c23d4b',
      },
    }
  }
};

function CheckoutDialogValueForValue(props){

  const [state,setState] = useState({
    //show:                    'payment_method_selection',
    show:                      '',
    order_id:                  null,
    payment_method:            'stripe',
    coupon_code:               '',
    coupon_error:              '',
    error_message:             '',
    success_message:           '',
    email:                     '',
    email_valid:               false,
    email_error:               false,
    email_error_message:       '',
    tos:                       false,
    tos_error:                 false,
    loading:                   true,
    donation_amount:           0,
  });

  const [checkout_method, setCheckoutMethod] = useState(null)

  const onChangeCheckoutMethod = (ev, value) => {
    setCheckoutMethod(value);
  }

  const onChangeDonationAmount = (ev, value) => {

    const data = { ...state };

    data[ev.target.name] = parseInt(ev.target.value);
    if(ev.target.value === 0){
      data['payment_method'] = 'none';
    }

    setState(data);

  }

  const onChange = (ev, value) => {

    const data = { ...state };

    data[ev.target.name] = ev.target.value;

    setState(data);

  }

  const changeEmail = (ev, value) => {

    setState({
      ...state,
      tos_error:false,
      email_error_message:``,
      email_error:false,
      email_valid:false,
      email: ev.target.value
    });

  }


  const tosIsValid = (e) => {
    let tos = state.tos;
    if(typeof e !== 'undefined' && typeof e.target !== 'undefined'){
      tos = e.target.checked;
    }
    return {valid:tos, error:!tos};
  }

  const validateTos = (e) => {
    let validation = tosIsValid(e);
    setState({
      ...state,
      tos:validation.valid,
      tos_error:validation.error,
    });
  }

  const emailIsValid = () => {
    let email_error_message = '';
    let email_error = false;
    let email_valid = false;

    if ((/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(state.email)))
    {
      email_error_message = '';
      email_valid = true;

    }else{

      email_error_message = 'Please enter a valid email address';
      email_error = true;

    }
    return {
      valid: email_valid,
      error: email_error,
      error_message: email_error_message
    };
  }

  const validateEmail = (show_error) => {
    const data = { ...state };

    let validation = emailIsValid();

    data['email_error'] = validation.error;
    data['email_error_message'] = validation.error_message;
    data['email_valid'] = validation.valid;

    setState(data);

  }

  const changeCoupon = (ev, value) => {

    setState({
      ...state,
      coupon_code: ev.target.value,
      coupon_error: '',
    });

  }

  const submitCouponCode = (e) => {
    let email_validation = emailIsValid();
    let tos_validation = emailIsValid();

    setState({
      ...state,
      email_error:         email_validation.error,
      email_error_message: email_validation.error_message,
      email_valid:         email_validation.valid,
      tos:                 tos_validation.valid,
      tos_error:           tos_validation.error,
    })

    if(e && typeof e.preventDefault !== 'undefined'){
      e.preventDefault();
    }


    fetch(env.site_url + '/coupon/check',{
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coupon:state.coupon_code,
      })
    })
      .then(res => res.json())
      .then(response => {
        if (response.error) {
          props.setOrderInfo({
            ...props.orderInfo,
            coupon_code:               '',
            refreshCalculationCounter: (props.orderInfo.refreshCalculationCounter+1),
          });

          setState({...state, coupon_error: response.error,});
        }else{
          props.setOrderInfo({
            ...props.orderInfo,
            coupon_code:               state.coupon_code,
            refreshCalculationCounter: (props.orderInfo.refreshCalculationCounter+1),
          });
        }
      });
  }

  const downloadStl = () => {
    if(typeof props.downloadStl !== 'undefined'){
      props.downloadStl();
    }
  }

  useEffect(() => {
    if(typeof props.onBeforeUpload !== 'undefined'){
      props.onBeforeUpload();
    }
    props.getStlAsString((data) => {
      // Create a blob from the STL data
      const blob = new Blob([data], { type: 'application/octet-stream' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'model.stl'; // You can customize the filename
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update state to show success message
      setState({...state, show:'success_message', loading:false});
      
      if(typeof props.onUploadReady !== 'undefined'){
        props.onUploadReady();
      }
    })
  },[]);

  const [calcData,setCalcData] = useState({total:0,rows:[]});



  const handlePaymentMethodSelection = (val) => {
    setState({...state, payment_method: val,});
  }

  const button_next = () => {
    setState({...state, show:state.payment_method + '_checkout_form'});
  };

  return (
    <Dialog
      maxWidth='sm'
      fullWidth={true}
      aria-labelledby="customized-dialog-title"
      open={true}
      onClose={props.closeDialog}
    >
      <DialogContent dividers>
        { state.loading &&
            <LoadingIndicator />
        }

        {state.show === 'payment_method_selection' && (

          <div className="payment_method">
              {/*
            <List>
              <ListItem
                role={undefined} dense button onClick={() => {setState({...state, tos:!state.tos});}}
                style={(
                  state.tos_error?{
                    border: '2px solid #e53935',
                    boxSizing:'border-box',
                  }:{})}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={state.tos}
                      onChange={validateTos}
                      disableRipple
                      inputProps={{ 'aria-labelledby': 'tos_checkbox_label' }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    id={'tos_checkbox_label'}
                    disableTypography={true}
                    style={{
                      fontSize:'0.8em',

                    }}
                  >
                    I have read, understood and accepted the <a href="/tos" target="_blanc">Terms of service</a>, <a href="/pp" target="_blanc">privacy policy</a> and <a href="/cp" target="_blanc">cookie policy</a>.
                  </ListItemText>
                </ListItem>
              </List>
              <Grid
                container
                spacing={4}
                key={'payment_method_selection_2'}
              >
                <Grid
                  item
                  xs={3}
                >
                  <TextField
                    id="donation_amount"
                    label="Donation amount"
                    type="number"
                    name="donation_amount"
                    value={state.donation_amount}
                    onChange={onChangeDonationAmount}
                    {...{InputProps:{ endAdornment: <InputAdornment position="end">$</InputAdornment>, }}}
                    style={{
                      width: '100%',
                    }}
                  />
                </Grid>
                <Grid
                  item
                  xs={9}
                >
                  <TextField
                    id="email"
                    label="Email *"
                    type="text"
                    name="email"
                    value={state.email}
                    onChange={changeEmail}
                    onBlur={validateEmail}
                    helperText={state.email_error_message}
                    error={state.email_error}
                    style={{
                      width: '100%',
                    }}
                  />
                </Grid>
              </Grid>
            <form onSubmit={submitCouponCode}>
              <Grid
                container
                spacing={4}
                key={'payment_method_selection_2'}
              >
                <Grid
                  item
                  xs={6}
                >
                  <TextField
                    id="coupon_code"
                    label="Coupon code"
                    type="text"
                    name="coupon_code"
                    value={state.coupon_code}
                    onChange={changeCoupon}
                    style={{
                      width: '100%',
                    }}
                  />
                </Grid>
                <Grid
                  item
                  xs={6}
                  style={{
                    display: 'flex',
                    flexDirection:'column-reverse',
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={() => {
                      submitCouponCode();
                    }}>
                    Submit coupon code
                  </Button>
                </Grid>
                { state.coupon_error &&
                    <Grid
                      item
                      xs={12}
                      style={{paddingTop:0}}
                    >
                      <Alert severity="error">{ state.coupon_error }</Alert>
                    </Grid>
                }
              </Grid>
            </form>
            */}
            <Grid
              container
              spacing={4}
              key={'payment_method_selection_3'}
            >
              <Grid
                item
                xs={12}
              >
                <Typography variant="body1" component="p" style={{marginRight: '5px', }}>
                  Enter the amount to donate in $ (USD)
                </Typography>
                <TextField
                  id="donation_amount"
                  label="Donation amount"
                  type="number"
                  name="donation_amount"
                  value={state.donation_amount}
                  onChange={onChangeDonationAmount}
                  {...{InputProps:{ endAdornment: <InputAdornment position="end">$</InputAdornment>, }}}
                  style={{
                    width: '100%',
                  }}
                />
              </Grid>
              <Grid
                item
                xs={12}
              >
                <Typography variant="body1" component="p" style={{marginRight: '5px', }}>
                  Donate to support this project
                </Typography>
                <List>
                  <ListItem key={'payment_method_selection_list_item_stripe'} role={undefined} dense button onClick={() => {handlePaymentMethodSelection('stripe')}}>
                    <ListItemIcon>
                      <Radio
                        edge="start"
                        checked={(state.payment_method === 'stripe'?true:false)}
                        inputProps={{ 'aria-labelledby': 'stripe_payment_method_label' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={'stripe_payment_method_label'}
                      disableTypography={true}
                      style={{
                        display: 'flex',
                        align:'center',
                        fontSize:'0.7em',
                      }}
                    >
                      <img style={{marginRight:'5px'}} title="Credit card" src="/images/payment_option_cc.svg" /> powered by stripe
                    </ListItemText>
                  </ListItem>
                  <ListItem key={'payment_method_selection_list_item_paypal'} role={undefined} dense button onClick={() => {handlePaymentMethodSelection('paypal')}}>
                    <ListItemIcon>
                      <Radio
                        edge="start"
                        checked={(state.payment_method === 'paypal'?true:false)}
                        inputProps={{ 'aria-labelledby': 'paypal_payment_method_label' }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      id={'paypal_payment_method_label'}
                      disableTypography={true}
                      style={{
                        display: 'flex',
                        align:'center',
                        fontSize:'0.7em',
                      }}
                    >
                      <img style={{marginRight:'5px'}} title="PayPal" src="/images/payment_option_paypal.svg" />
                    </ListItemText>
                  </ListItem>
                </List>
              </Grid>
            </Grid>

          </div>
        )}

        {state.show === 'success_message' && (

          <Grid
            container
            spacing={4}
            key={'payment_method_selection_2'}
          >
            {/**            <Grid
              item
              xs={12}
            >
              <Alert
                severity="info"
                style={{
                  display: 'flex',
                  align:'center',
                  fontSize:'0.9em',
                  marginTop:'16px',
                }}
              >
                <strong>Value for value</strong>
                <br/>
                Evaluate for your selves how much value you get from Nametag Designer and please donate accordingly.
<br/>Contact: service@nametag-designer.com
              </Alert>
            </Grid>
            */}
            <Grid
              item
              xs={12}
            >
              <Paper style={{backgroundColor:'#f1ffde'}}>
                <Typography style={{padding:'30px', textAlign: 'center', fontSize: '1.1em', lineHeight: '1.6'}} component="div">
                  <strong style={{fontSize: '1.3em', color: '#2e7d32'}}>Success!</strong>
                  <br/><br/>
                  Your custom nametag has been downloaded successfully!
                  <br/><br/>
                  <div style={{
                    backgroundColor: '#ffffff', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    margin: '20px 0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <strong style={{color: '#1976d2'}}>Thank you for using Nametag Designer!</strong>
                    <br/><br/>
                    If you found this tool helpful, please consider sharing it with others:
                    <br/><br/>
                    <strong>Tell your friends and colleagues</strong> about this free tool
                    <br/>
                    <strong>Share on social media</strong> and help others discover it
                    <br/>
                    <strong>Link to cioddi.github.io/nametag-designer/</strong> in your posts
                    <br/><br/>
                    <em style={{color: '#666', fontSize: '0.9em'}}>
                      Your support helps keep this project alive and free for everyone!
                    </em>
                  </div>
                </Typography>
              </Paper>
            </Grid>
          </Grid>

        )}
      </DialogContent>
      <DialogActions>
        <Grid
          container
          spacing={2}
          key={'payment_method_selection_2'}
        >
          <Grid
            item
            xs={6}
          >
            <Button onClick={props.closeDialog} variant='contained' color="primary">
              cancel
            </Button>
          </Grid>
          <Grid
            item
            xs={6}
            style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end'}}
          >
            {state.show === 'payment_method_selection' && state.donation_amount > 0 && (
              <Button variant="contained" onClick={button_next}>
                <CreditCardIcon style={{marginRight:'10px'}} />
                Next
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
}

export default CheckoutDialogValueForValue;
