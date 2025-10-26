import React, { useState, useEffect, useContext } from 'react';
import { JscadContext } from '../../components/JscadContext';
import { makeStyles } from '@material-ui/styles';
import { List } from 'react-virtualized';
import {
  //  Card,
  //  CardHeader,
  //  CardContent,
  //  CardActions,
  //  Divider,
  Grid,
  Button,
  //  Button,
  Select,
  InputLabel,
  TextField,
  MenuItem,
  FormControl
} from '@material-ui/core';

import fonts from './fonts_detailed.js';

const useStyles = makeStyles(() => ({
  root: {}
}));

const rtl_languages = ['arabic', 'hebrew'];

const FontPicker = props => {
  const jscadContext = useContext(JscadContext);

  const [fontpicker_open, setFontpickerOpen] = useState(false);
  const [language, setLanguage] = useState('all');
  const [textInputDirection, setTextInputDirection] = useState('LTR');
  const [fonts_shown, setFontsShown] = useState(fonts);

  const changeLanguage = ev => {
    console.log(ev);
    setLanguage(ev.target.value);
    var tmp_fonts_shown = [];

    if (rtl_languages.indexOf(ev.target.value) !== -1) {
      setTextInputDirection('RTL');
    } else {
      setTextInputDirection('LTR');
    }

    for (var i = 0; i < fonts.length; i++) {
      if (fonts[i].subsets.indexOf(ev.target.value) !== -1)
        tmp_fonts_shown.push(fonts[i]);
    }

    setFontsShown(tmp_fonts_shown);
    if (typeof tmp_fonts_shown[0] !== 'undefined') {
      selectFont(tmp_fonts_shown[0].name, 0);
    }
  };

  const selectFont = (value, index) => {
    let data = { ...jscadContext.stateRef.current };

    data[props.field_cfg.name] = {
      font: value,
      font_index: index,
      lang: 'all'
    };
    jscadContext.stateRef.current = data;
    jscadContext.setState(data);

    setFontpickerOpen(false);
  };

  const selectRandomFont = () => {
    let font_cnt = fonts_shown.length;
    let random_font_index = false;
    while (typeof fonts_shown[random_font_index] === 'undefined') {
      random_font_index = Math.floor(Math.random() * 1000);
      console.log('RAND ' + random_font_index);
    }
    selectFont(fonts_shown[random_font_index].name, random_font_index);
  };

  useEffect(() => {
    selectRandomFont();
  }, []);

  const renderFontPreviewMenuItem = ({
    key,
    index,
    isScrolling,
    isVisible,
    style
  }) => {
    return (
      <MenuItem
        key={fonts_shown[index].name}
        value={fonts_shown[index].name}
        style={{
          ...style,
          overflow: 'hidden',
          width: '300px',
          backgroundColor:
            index === jscadContext.state[props.field_cfg.name].font_index
              ? '#aaa'
              : 'rgba(0,0,0,0)',
          paddingTop: '2px',
          paddingBottom: '2px'
        }}
        onClick={() => selectFont(fonts_shown[index].name, index)}>
        <img
          src={'/nametag-designer/assets/font_previews/' + fonts_shown[index].name + '.png'}
          style={{
            height: '25px'
          }}
        />
      </MenuItem>
    );
  };

  return (
    <div>
      <Grid container>
        <Grid item xs={9} key={1}>
          <FormControl>
            <InputLabel id="fontpicker-language-select-label">
              Language
            </InputLabel>
            <Select
              labelId="fontpicker-language-select-label"
              id="fontpicker-language-select"
              value={
                typeof jscadContext.state[props.field_cfg.name] !== 'undefined'
                  ? jscadContext.state[props.field_cfg.name].lang
                  : ''
              }
              onChange={changeLanguage}
              style={{
                width: '100%',
                marginBottom: '10px'
              }}>
              <MenuItem value="all">All languages</MenuItem>
              <MenuItem value="latin">Latin</MenuItem>
              <MenuItem value="latin-ext">Latin Extended</MenuItem>
              <MenuItem value="sinhala">Sinhala</MenuItem>
              <MenuItem value="greek">Greek</MenuItem>
              <MenuItem value="greek-ext">Greek Extended</MenuItem>
              <MenuItem value="vietnamese">Vietnamese</MenuItem>
              <MenuItem value="hebrew">Hebrew</MenuItem>
              <MenuItem value="cyrillic">Cyrillic</MenuItem>
              <MenuItem value="cyrillic-ext">Cyrillic Extended</MenuItem>
              <MenuItem value="arabic">Arabic</MenuItem>
              <MenuItem value="devanagari">Devanagari</MenuItem>
              <MenuItem value="khmer">Khmer</MenuItem>
              <MenuItem value="tamil">Tamil</MenuItem>
              <MenuItem value="thai">Thai</MenuItem>
              <MenuItem value="bengali">Bengali</MenuItem>
              <MenuItem value="gujarati">Gujarati</MenuItem>
              <MenuItem value="oriya">Oriya</MenuItem>
              <MenuItem value="malayalam">Malayalam</MenuItem>
              <MenuItem value="gurmukhi">Gurmukhi</MenuItem>
              <MenuItem value="kannada">Kannada</MenuItem>
              <MenuItem value="telugu">Telugu</MenuItem>
              <MenuItem value="korean">Korean</MenuItem>
              <MenuItem value="tibetan">Tibetan</MenuItem>
              <MenuItem value="japanese">Japanese</MenuItem>
              <MenuItem value="chinese-simplified">Chinese Simplified</MenuItem>
              <MenuItem value="chinese-hongkong">Chinese Hongkong</MenuItem>
              <MenuItem value="chinese-traditional">
                Chinese Traditional
              </MenuItem>
              <MenuItem value="myanmar">Myanmar</MenuItem>
            </Select>
          </FormControl>
          <TextField
            select
            value={
              typeof jscadContext.state[props.field_cfg.name] !== 'undefined'
                ? jscadContext.state[props.field_cfg.name].font
                : ''
            }
            style={{
              width: '100%',
              //minWidth: '300px',
              height: '35px',
              marginBottom: '15px'
            }}
            SelectProps={{
              renderValue: selected => {
                return (
                  <img
                    src={'/nametag-designer/assets/font_previews/' + selected + '.png'}
                    style={{
                      height: '25px'
                    }}
                  />
                );
              },
              open: fontpicker_open,
              onOpen: () => {
                setFontpickerOpen(true);
              },
              onClose: () => {
                setFontpickerOpen(false);
              }
            }}>
            <List
              width={300}
              height={400}
              rowCount={fonts_shown.length}
              rowHeight={35}
              rowRenderer={renderFontPreviewMenuItem}
              scrollToIndex={
                typeof jscadContext.state[props.field_cfg.name] !== 'undefined'
                  ? jscadContext.state[props.field_cfg.name].font_index
                  : 0
              }
            />
          </TextField>
        </Grid>
        <Grid item xs={3} key={2}>
          <Button
            onClick={selectRandomFont}
            style={{ width: '100%' }}
            variant="contained">
            Random font
          </Button>
        </Grid>
      </Grid>
      {/*<Grid
            container
            spacing={4}
          >
            <Grid
              item
              xs={6}

            >
              <Button onClick={() => {selectFont(fonts[(state.font_index+1)], state.font_index+1);localStorage.fontIndex = (parseInt(state.font_index)+1);let workingFonts = JSON.parse(localStorage.workingFonts); workingFonts.push(fonts[state.font_index]); localStorage.workingFonts = JSON.stringify(workingFonts)}}
               style={{width: '100%'}}
               variant='contained'
              >
                FONT WORKS
							</Button>
            </Grid>
            <Grid
              item
              xs={6}

            >
              <Button onClick={() => {selectFont(fonts[(state.font_index+1)], state.font_index+1);localStorage.fontIndex = (parseInt(state.font_index)+1);}}
               style={{width: '100%'}}
               variant='contained'
              >
                FONT DAMAGED
							</Button>
            </Grid>
          </Grid>*/}
    </div>
  );
};

export default FontPicker;
