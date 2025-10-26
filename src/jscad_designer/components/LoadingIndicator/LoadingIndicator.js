import React, { Component } from 'react';
import { 
  //  Typography, 
  //  Paper, 
  //  Container, 
  //  Grid, 
  //  FormControl,
  //  TextField, 
  //  Input, 
  //  InputLabel, 
  //  FormHelperText, 
  CircularProgress 
} from '@material-ui/core';

class LoadingIndicator extends Component {

  construct(props) {
    this.props = props;
  }

  render() {
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(256,256,256,0.5)', overflow: 'hidden', zIndex: (this.props.zIndex? this.props.zIndex:1000)}}>
        <div style={{  width: '100%', position: 'absolute', top: '50%', marginTop: '-22px', textAlign: 'center' }}>
          <CircularProgress />
        </div>
      </div>
    );
  }
}

export default LoadingIndicator;
