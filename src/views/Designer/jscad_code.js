/*eslint no-undef: "off"*/
import React, { useState, useEffect } from 'react';
import CropSquareRoundedIcon from '@material-ui/icons/CropSquareRounded';
import CheckBoxOutlineBlankSharpIcon from '@material-ui/icons/CheckBoxOutlineBlankSharp';
import PanoramaFishEyeSharpIcon from '@material-ui/icons/PanoramaFishEyeSharp';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import CloseSharpIcon from '@material-ui/icons/CloseSharp';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import CheckIcon from '@material-ui/icons/Check';
import StandIcon from '../../components/stand_icon';

import TextFieldsIcon from '@material-ui/icons/TextFields';
import StopIcon from '@material-ui/icons/Stop';
import StopOutlinedIcon from '@material-ui/icons/StopOutlined';

let param_def = [
  {
    type: 'fieldset',
    name: 'text',
    label: 'TEXT',
    icon: <TextFieldsIcon />,
    params: [
      {
        type: 'list',
        name: 'textblock',
        elements: [
          {
            name: 'text',
            type: 'string',
            default: 'Name',
            label: 'Text'
          },
          {
            name: 'font',
            type: 'font',
            default: {
              font: 'changa_one',
              font_index: 0,
              lang: 'all'
            },
            label: 'Font'
          },
          {
            name: 'size',
            label: 'size',
            type: 'integer',
            default: 72,
            unit: 'px'
          },
          {
            name: 'marginTop',
            label: 'margin top',
            type: 'integer',
            default: 10,
            unit: 'mm'
          },
          {
            name: 'marginLeft',
            label: 'margin left',
            type: 'integer',
            default: 10,
            unit: 'mm'
          },
          {
            name: 'break',
            label: 'Break',
            type: 'radio',
            default: true,
            options: [
              {
                value: true,
                icon: <CheckIcon />
              },
              {
                value: false,
                icon: <CloseSharpIcon />
              }
            ]
          }
        ]
      },
      {
        name: 'text_cutout',
        label: 'Text cutout',
        type: 'radio',
        default: false,
        hide: cfg => ['none', 'stand'].indexOf(cfg.backplateShape) !== -1,
        options: [
          {
            value: true,
            icon: <CheckIcon />
          },
          {
            value: false,
            icon: <CloseSharpIcon />
          }
        ]
      },
      {
        name: 'textXAdjustment',
        type: 'integer',
        default: 0,
        unit: 'mm',
        label: 'Text X pos',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) !== -1
      },
      {
        name: 'textYAdjustment',
        type: 'integer',
        default: 0,
        unit: 'mm',
        label: 'Text Y pos',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) !== -1
      },
      {
        name: 'textCutoutDepth',
        type: 'integer',
        default: 5,
        unit: 'mm',
        label: 'Text cutout depth',
        hide: cfg => !cfg.text_cutout
      },
      {
        name: 'textScale',
        type: 'integer',
        default: 100,
        unit: '%',
        label: 'Text scale',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) !== -1
      },
      {
        name: 'textThickness',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Text thickness'
      }
    ]
  },
  {
    type: 'fieldset',
    name: 'backplate',
    label: 'BACKPLATE',
    icon: <StopIcon />,
    params: [
      {
        name: 'backplateShape',
        label: 'Backplate',
        type: 'radio',
        default: 'round_rectangle',
        options: [
          {
            value: 'rectangle',
            icon: <CheckBoxOutlineBlankSharpIcon />,
            presets: {
              textThickness: 10,
              backplateThickness: 6,
              border: 'raised'
            }
          },
          {
            value: 'round_rectangle',
            icon: <CropSquareRoundedIcon />,
            presets: {
              textThickness: 10,
              backplateThickness: 6,
              border: 'raised'
            }
          },
          {
            value: 'circle',
            icon: <PanoramaFishEyeSharpIcon />,
            presets: {
              textThickness: 10,
              backplateThickness: 6,
              border: false
            }
          },
          {
            value: 'star',
            icon: <StarBorderIcon />,
            presets: {
              textThickness: 10,
              backplateThickness: 6,
              border: false
            }
          },
          {
            value: 'heart',
            icon: <FavoriteBorderIcon />,
            presets: {
              textThickness: 10,
              backplateThickness: 6
            }
          },
          {
            value: 'stand',
            icon: <StandIcon />,
            presets: {
              textThickness: 8,
              backplateThickness: 8
            }
          },
          {
            value: 'none',
            icon: <CloseSharpIcon />
          }
        ]
      },
      {
        name: 'paddingTop',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Padding top',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) === -1
      },
      {
        name: 'paddingRight',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Padding right',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) === -1
      },
      {
        name: 'paddingBottom',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Padding bottom',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) === -1
      },
      {
        name: 'paddingLeft',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Padding left',
        hide: cfg => 'round_rectangle'.indexOf(cfg.backplateShape) === -1
      },
      {
        name: 'backplateThickness',
        type: 'integer',
        default: 6,
        unit: 'mm',
        label: 'Backplate thickness'
      },
      {
        name: 'backplateDepth',
        type: 'integer',
        default: 40,
        unit: 'mm',
        label: 'Backplate depth',
        hide: cfg => 'stand'.indexOf(cfg.backplateShape) === -1
      },
      {
        name: 'border',
        label: 'Border',
        type: 'radio',
        default: 'raised',
        hide: cfg =>
          ['none', 'stand', 'star'].indexOf(cfg.backplateShape) !== -1,
        options: [
          {
            value: 'cutout',
            icon: <div>cutout</div>
          },
          {
            value: 'raised',
            icon: <div>raised</div>
          },
          {
            value: false,
            icon: <CloseSharpIcon />
          }
        ]
      },
      {
        name: 'borderWidth',
        type: 'integer',
        default: 8,
        unit: 'mm',
        label: 'Border width',
        hide: cfg =>
          !cfg.border || ['none', 'stand'].indexOf(cfg.backplateShape) !== -1
      },
      {
        name: 'borderHeight',
        type: 'integer',
        default: 10,
        unit: 'mm',
        label: 'Border thickness',
        hide: cfg =>
          !cfg.border || ['none', 'stand'].indexOf(cfg.backplateShape) !== -1
      },
      {
        name: 'borderCutoutDepth',
        type: 'integer',
        default: 5,
        unit: 'mm',
        label: 'Border cutout depth',
        hide: cfg => !(cfg.border === 'cutout'),
        presets: {
          borderHeight: 10
        }
      }
    ]
  },
  {
    type: 'fieldset',
    name: 'addons',
    label: 'Addons',
    icon: <StopOutlinedIcon />,
    params: [
      {
        name: 'hole',
        label: 'Hole (Keychain)',
        type: 'radio',
        default: false,
        hide: cfg =>
          ['none', 'stand', 'star'].indexOf(cfg.backplateShape) !== -1,
        options: [
          {
            value: false,
            icon: <CloseSharpIcon />
          },
          {
            value: true,
            icon: <CheckIcon />
          }
        ]
      },
      {
        name: 'hole_radius',
        type: 'integer',
        default: 5,
        unit: 'mm',
        label: 'Hole radius',
        hide: cfg => !cfg.hole
      },
      {
        name: 'hole_border_distance',
        type: 'integer',
        default: 5,
        unit: 'mm',
        label: 'Hole border distance',
        hide: cfg => !cfg.hole
      },
      {
        name: 'hole_h_position',
        label: 'Hole horizontal position',
        type: 'radio',
        default: 'right',
        hide: cfg => !cfg.hole,
        options: [
          {
            value: 'left'
          },
          {
            value: 'center'
          },
          {
            value: 'right'
          }
        ]
      },
      {
        name: 'hole_v_position',
        label: 'Hole vertical position',
        type: 'radio',
        default: 'top',
        hide: cfg => !cfg.hole,
        options: [
          {
            value: 'top'
          },
          {
            value: 'middle'
          },
          {
            value: 'bottom'
          }
        ]
      },
      {
        name: 'hole_adjust_x',
        type: 'integer',
        default: 0,
        unit: 'mm',
        label: 'Hole adjust x position',
        hide: cfg => !cfg.hole
      },
      {
        name: 'hole_adjust_y',
        type: 'integer',
        default: 0,
        unit: 'mm',
        label: 'Hole adjust y position',
        hide: cfg => !cfg.hole
      }
    ]
  }
];

let getJscadIncludes = config => {
  let fonts = [];
  let i = 0;
  while (typeof config['textblock_font_' + i] !== 'undefined') {
    fonts.push(
      window.location.origin +
        '/assets/fonts/' +
        config['textblock_font_' + i].font +
        '_ttf.jscad'
    );
    i++;
  }
  return [window.location.origin + '/assets/opentype.min.jscad?v=2', ...fonts];
};

let getCode = () => {
  function getParamDefByName(name) {
    for (var i = 0; i < params.param_def.length; i++) {
      if (params.param_def[i].type === 'fieldset') {
        for (var k = 0; k < params.param_def[i].params.length; k++) {
          if (params.param_def[i].params[k].name === name)
            return params.param_def[i].params[k];
        }
      } else {
        if (params.param_def[i].name === name) return params.param_def[i];
      }
    }
  }

  function main(params) {
    //if (!params.textnfont.font) return [];
    console.log('FROM THE SCRIPT');
    console.log('FROM THE SCRIPT: ' + JSON.stringify(params));
    let textBlocks = [];
    let csgTextObj = null;
    let i = 0;
    console.log('TEXTBLOCKS: ' + i);

    let prevYTranslation = 0;
    let prevXTranslation = 0;
    let prevObjectBounds = null;
    let textblockPrefix = 'textblock_';
    console.log('now build text object');
    while (
      typeof params[textblockPrefix + 'text_' + i] !== 'undefined' &&
      i >= 0
    ) {
      textBlocks.push({
        text: params[textblockPrefix + 'text_' + i]
      });
      console.log(
        params[textblockPrefix + 'font_' + i].font,
        params[textblockPrefix + 'text_' + i],
        params[textblockPrefix + 'size_' + i]
      );
      let currTextObj = build_text_object(
        params[textblockPrefix + 'font_' + i].font,
        params[textblockPrefix + 'text_' + i],
        params[textblockPrefix + 'size_' + i]
      );
      console.log('build text object');
      if (csgTextObj) {
        let prevBounds = csgTextObj.getBounds();
        let y_translation = 0;
        let x_translation = 0;
        if (params[textblockPrefix + 'break_' + i]) {
          prevYTranslation = 0;
          y_translation = -1 * Math.abs(prevBounds[0].y - prevBounds[1].y);
        } else {
          x_translation =
            Math.abs(prevObjectBounds[0].x - prevObjectBounds[1].x) +
            prevXTranslation;
        }
        currTextObj = translate(
          [
            x_translation + params[textblockPrefix + 'marginLeft_' + i],
            y_translation +
              prevYTranslation -
              params[textblockPrefix + 'marginTop_' + i],
            0
          ],
          currTextObj
        );
        csgTextObj = union(csgTextObj, currTextObj);

        prevYTranslation = y_translation;
        prevXTranslation = x_translation;
      } else {
        currTextObj = translate(
          [
            params[textblockPrefix + 'marginLeft_' + i],
            -params[textblockPrefix + 'marginTop_' + i],
            0
          ],
          currTextObj
        );
        csgTextObj = currTextObj;
      }
      prevObjectBounds = currTextObj.getBounds();
      i = i + 1;
    }
    var csgText = centerObject(csgTextObj);
    text_bounds = csgText.getBounds();
    console.log('FROM THE SCRIPT: ' + JSON.stringify(csgText.getBounds()));

    var backplate = null;
    switch (params.backplateShape) {
      case 'circle':
        backplate = createCircleBackplate(text_bounds);
        break;
      case 'rectangle':
        backplate = createBackplate(text_bounds);
        break;
      case 'heart':
        backplate = createHeartBackplate(text_bounds);
        break;
      case 'star':
        backplate = createStarBackplate(text_bounds);
        //backplate = createHeartBackplate2(text_bounds);
        break;
      case 'round_rectangle':
        backplate = createRoundBackplate(text_bounds);
        //return csgText;
        break;
      case 'stand':
        backplate = createStandBackplate(text_bounds);
        params.border = false;
        //return csgText;
        break;
      case 'none':
      default:
        return csgText;
    }

    // neue Möglichkeit finden hide funktion wieder einzubauen
    if (!getParamDefByName('textXAdjustment').hide(params)) {
      csgText = csgText.translate([
        params.textXAdjustment,
        params.textYAdjustment,
        0
      ]);
    }

    if (!getParamDefByName('textScale').hide(params)) {
      csgText = csgText.scale([
        params.textScale / 100,
        params.textScale / 100,
        1
      ]);
    }

    if (params.border) {
      border = create_border(backplate);

      if (params.border === 'cutout') {
        backplate = difference(
          backplate,
          border.translate([
            0,
            0,
            params.backplateThickness - params.borderCutoutDepth
          ])
        );
      } else {
        backplate = union(backplate, border);
      }
    }

    if (params.text_cutout) {
      return difference(
        backplate,
        csgText.translate([
          0,
          0,
          params.backplateThickness - params.textCutoutDepth
        ])
      );
    }

    if (params.backplateShape === 'stand') {
      csgText = csgText.translate([
        0,
        0,
        params.backplateDepth - params.textThickness
      ]);
    } else {
      csgText = csgText.translate([0, 0, 0.001]);
    }

    var result = union(csgText, backplate.setColor(html2rgb('#3f51b5')));

    if (params.hole === true) {
      result = add_hole(result);
    }

    console.log('FROM ' + JSON.stringify(result));

    return result;
    //return [csgText, backplate.setColor(html2rgb('#3f51b5'))];
  }

  function add_hole(mesh) {
    //params.hole_radius = 5
    //params.hole_border_distance = 5
    //params.hole_h_position = 'left'
    //params.hole_v_position = 'top'
    let radius = parseInt(params.hole_radius);
    let border_distance = parseInt(params.hole_border_distance);
    let c1 = circle({ r: radius, fn: 100 });
    c1 = linear_extrude({ height: 1000 }, c1).translate([
      radius * -1,
      radius * -1,
      -50
    ]);

    meshbounds = mesh.getBounds();
    nameplate_width = Math.abs(meshbounds[1].x) + Math.abs(meshbounds[0].x);
    nameplate_height = Math.abs(meshbounds[1].y) + Math.abs(meshbounds[0].y);

    console.log(meshbounds);
    console.log(nameplate_width);
    let translate_x = 0;
    if (params.hole_h_position === 'left') {
      translate_x = (-1 * nameplate_width) / 2 + border_distance + radius;
    }
    if (params.hole_h_position === 'right') {
      translate_x = nameplate_width / 2 - border_distance - radius;
    }
    let translate_y = 0;
    if (params.hole_v_position === 'top') {
      translate_y = nameplate_height / 2 - border_distance - radius;
    }
    if (params.hole_v_position === 'bottom') {
      translate_y = (-1 * nameplate_height) / 2 + border_distance + radius;
    }

    return difference(
      mesh,
      c1
        .translate([translate_x, translate_y, 0])
        .translate([
          parseInt(params.hole_adjust_x),
          parseInt(params.hole_adjust_y),
          0
        ])
    );
  }

  function createTextOnly() {
    let text = build_text_object(params);
    let bounds = text.getBounds();
    text = text.translate([(-1 * bounds[1].x) / 2, (-1 * bounds[1].y) / 2, 0]);

    return text;
  }

  function build_text_object(font, text, size) {
    let fontObj = Font3D.parse(eval(font + '_ttf_data.buffer'));
    let cagText = Font3D.cagFromString(fontObj, text, size);
    let csgText = linear_extrude(
      { height: params.textThickness },
      cagText[0].union(cagText)
    ).setColor(html2rgb('#7286ef'));

    return csgText;
  }

  function addPadding(obj) {
    //console.log('PADDING ADJUSTMENT');
    //console.log([(-1*params.paddingLeft)+parseInt(params.paddingRight),(-1*params.paddingBottom)+parseInt(params.paddingTop),0]);
    return obj.translate([
      (-1 * params.paddingLeft + parseInt(params.paddingRight)) / 2,
      (-1 * params.paddingBottom + parseInt(params.paddingTop)) / 2,
      0
    ]);
  }

  function centerObject(obj) {
    let bounds = obj.getBounds();
    //console.log('CENTER FUNCTION');
    //console.log(bounds);
    //console.log([(-1 * bounds[1].x/2), (-1 * bounds[1].y/2),0]);
    obj = translate(
      [
        (-1 * bounds[1].x) / 2 + (bounds[0].x / 2) * -1,
        (-1 * bounds[1].y) / 2 + (bounds[0].y / 2) * -1,
        0
      ],
      obj
    );
    return obj;
  }

  function createHeartBackplate2(bounds) {
    var cag201 = new CSG.Path2D([[104.58597, -224.03328]], false);
    cag201 = cag201.appendBezier([
      [77.543897, -196.26168],
      [48.956095, -169.94223],
      [22.992042, -141.15586]
    ]);
    cag201 = cag201.appendBezier([
      [5.9088445, -116.74535],
      [14.855171, -76.999825],
      [43.213353, -65.359061]
    ]);
    cag201 = cag201.appendBezier([
      [64.53867, -56.968174],
      [89.171612, -65.987845],
      [104.58598, -81.770658]
    ]);
    cag201 = cag201.appendBezier([
      [120.40025, -65.515942],
      [146.15957, -56.516807],
      [167.75842, -66.11954899999999]
    ]);
    cag201 = cag201.appendBezier([
      [197.13874, -80.068782],
      [204.29021, -124.72919999999999],
      [180.89514, -147.27044]
    ]);
    cag201 = cag201.appendBezier([
      [155.94376, -173.33217000000002],
      [129.96077, -198.38486],
      [104.58597, -224.03328]
    ]);
    cag201 = cag201.close();

    cag011 = cag201.innerToCAG();

    //cag101 = cag101.center([0,0,0]);
    cag101 = linear_extrude({ height: params.backplateThickness }, cag011);
    //cag101 = scale([4,4,1],cag101);

    var shape_bounds = cag101.getBounds();
    //console.log('shape_bounds');

    let scale_factor = (bounds[1].x + 70) / shape_bounds[1].x;
    cag101 = scale([scale_factor, scale_factor, 1], cag101);

    return centerObject(cag101);
  }

  function createStandBackplate(bounds) {
    let stand_height = 10;

    let cube_x =
      bounds[1].x -
      bounds[0].x +
      (parseInt(params.paddingRight) + parseInt(params.paddingLeft));
    let cube_y =
      bounds[1].y -
      bounds[0].y +
      (parseInt(params.paddingTop) + parseInt(params.paddingBottom));
    let cube_1 = cube({
      size: [cube_x, params.backplateThickness, params.backplateDepth]
    });

    cube_1 = centerObject(cube_1);
    cube_1 = cube_1.translate([
      0,
      ((Math.abs(bounds[0].y) + Math.abs(bounds[1].y) + stand_height / 2) / 2) *
        -1,
      0
    ]);
    return cube_1;
  }

  function old_createHeartBackplate(bounds) {
    var cag011 = new CSG.Path2D(
      [[6.7733327999999995, -12.050887939999999]],
      false
    );
    cag011 = cag011.appendPoint([5.95488842, -11.308643554]);
    cag011 = cag011.appendBezier([
      [3.0479997599999997, -8.669865984],
      [1.1288888, -6.928555009999999],
      [1.1288888, -4.797777399999999]
    ]);
    cag011 = cag011.appendBezier([
      [1.1288888, -3.0564664259999996],
      [2.492022026, -1.6933331999999999],
      [4.233332999999999, -1.6933331999999999]
    ]);
    cag011 = cag011.appendBezier([
      [5.215466255999999, -1.6933331999999999],
      [6.158088403999999, -2.1505331639999996],
      [6.7733327999999995, -2.8701997739999996]
    ]);
    cag011 = cag011.appendBezier([
      [7.388577195999999, -2.1505331639999996],
      [8.331199344, -1.6933331999999999],
      [9.313332599999999, -1.6933331999999999]
    ]);
    cag011 = cag011.appendBezier([
      [11.054643574, -1.6933331999999999],
      [12.417776799999999, -3.0564664259999996],
      [12.417776799999999, -4.797777399999999]
    ]);
    cag011 = cag011.appendBezier([
      [12.417776799999999, -6.928555009999999],
      [10.49866584, -8.669865984],
      [7.5917771799999985, -11.308643554]
    ]);
    cag011 = cag011.appendPoint([6.7733327999999995, -12.050887939999999]);
    cag011 = cag011.close();
    cag011 = cag011.innerToCAG();

    //cag101 = cag101.center([0,0,0]);
    cag101 = linear_extrude({ height: params.backplateThickness }, cag011);
    //cag101 = scale([4,4,1],cag101);

    var shape_bounds = cag101.getBounds();
    let scale_factor = (bounds[1].x + 70) / shape_bounds[1].x;
    cag101 = scale([scale_factor, scale_factor, 1], cag101);
    shape_bounds = cag101.getBounds();
    //console.log('shape_bounds');
    //console.log(shape_bounds);

    return centerObject(cag101).translate([0, shape_bounds[0].y / 12, 0]);
  }

  function createHeartBackplate(bounds) {
    let c1 = circle({ r: 10, fn: 100 });
    c1 = linear_extrude({ height: params.backplateThickness }, c1).translate([
      -2.115,
      0,
      0
    ]);

    let c2 = circle({ r: 10, fn: 100 });
    c2 = linear_extrude({ height: params.backplateThickness }, c2).translate([
      -17.885,
      0,
      0
    ]);
    sq = square(25.455844122716);
    sq = linear_extrude({ height: params.backplateThickness }, sq).translate([
      -8.5,
      -8.5,
      0
    ]);

    sq = sq.rotateZ(45).center(true);
    sq2 = square(40);
    sq2 = linear_extrude({ height: params.backplateThickness }, sq2).translate([
      -20,
      3,
      0
    ]);
    sq = difference(sq, sq2).translate([0, 0.0001, 0]);

    sq3 = square(50);
    sq3 = linear_extrude({ height: params.backplateThickness }, sq3).translate([
      -25,
      -47,
      0
    ]);
    circles = union(c1, c2);
    circles = difference(circles, sq3);

    sq4 = square(5);
    sq4 = linear_extrude({ height: params.backplateThickness }, sq4).translate([
      -2.5,
      0,
      0
    ]);
    let heart = union([circles, sq, sq4]);
    var shape_bounds = heart.getBounds();
    let textWidth = Math.abs(bounds[0].x) + Math.abs(bounds[1].x);
    let textHeight = Math.abs(bounds[0].y) + Math.abs(bounds[1].y);
    let shapeWidth = Math.abs(shape_bounds[0].x) + Math.abs(shape_bounds[1].x);

    let scale_factor = textWidth / (shapeWidth * 0.6);
    let scale_factor_height = textHeight / (shapeWidth * 0.6);
    if (scale_factor_height > scale_factor) {
      scale_factor = scale_factor_height;
    }
    heart = scale([scale_factor, scale_factor, 1], heart);
    shape_bounds = heart.getBounds();
    return centerObject(heart).translate([0, shape_bounds[0].y / 3, 0]);
  }

  function createStarBackplate(bounds) {
    var cag101 = new CSG.Path2D([[113.39286, -134.15715]], false);
    cag101 = cag101.appendPoint([70.63238, -111.03571]);
    cag101 = cag101.appendPoint([27.343921, -133.15287]);
    cag101 = cag101.appendPoint([36.120003, -85.340325]);
    cag101 = cag101.appendPoint([1.7084617, -51.005133]);
    cag101 = cag101.appendPoint([49.892857, -44.576793]);
    cag101 = cag101.appendPoint([71.913814, -1.2393143]);
    cag101 = cag101.appendPoint([92.917326, -45.078931]);
    cag101 = cag101.appendPoint([140.93857, -52.630088]);
    cag101 = cag101.appendPoint([105.73506, -86.152802]);
    cag101 = cag101.close();

    cag101 = cag101.innerToCAG();

    //cag101 = cag101.center([0,0,0]);
    cag101 = linear_extrude({ height: params.backplateThickness }, cag101);
    //cag101 = scale([4,4,1],cag101);

    var shape_bounds = cag101.getBounds();
    //console.log('shape_bounds');
    let textWidth = Math.abs(bounds[0].x) + Math.abs(bounds[1].x);
    let textHeight = Math.abs(bounds[0].y) + Math.abs(bounds[1].y);
    let shapeWidth = Math.abs(shape_bounds[0].x) + Math.abs(shape_bounds[1].x);

    let scale_factor = textWidth / (shapeWidth * 0.4);
    let scale_factor_height = textHeight / (shapeWidth * 0.4);
    if (scale_factor_height > scale_factor) {
      scale_factor = scale_factor_height;
    }
    cag101 = scale([scale_factor, scale_factor, 1], cag101);

    shape_bounds = cag101.getBounds();
    return centerObject(cag101).translate([0, shape_bounds[0].y / 35, 0]);
  }

  function createCircleBackplate(bounds) {
    let cube_x =
      bounds[1].x -
      bounds[0].x +
      (parseInt(params.paddingRight) + parseInt(params.paddingLeft));
    let cube_y =
      bounds[1].y -
      bounds[0].y +
      (parseInt(params.paddingTop) + parseInt(params.paddingBottom));
    let textWidth = Math.abs(bounds[0].x) + Math.abs(bounds[1].x);
    let textHeight = Math.abs(bounds[0].y) + Math.abs(bounds[1].y);
    let radius = textWidth / 2 + 20;
    let radiusHeight = textHeight / 2 + 60;
    if (radiusHeight > radius) {
      radius = radiusHeight;
    }
    let cube_1 = cylinder({ r: radius, h: params.backplateThickness, fn: 150 });

    return centerObject(cube_1);
  }

  function createBackplate(bounds) {
    let cube_x =
      bounds[1].x -
      bounds[0].x +
      (parseInt(params.paddingRight) + parseInt(params.paddingLeft));
    let cube_y =
      bounds[1].y -
      bounds[0].y +
      (parseInt(params.paddingTop) + parseInt(params.paddingBottom));
    let cube_1 = cube({ size: [cube_x, cube_y, params.backplateThickness] });

    cube_1 = centerObject(cube_1);
    cube_1 = addPadding(cube_1);
    return cube_1;
  }
  function createRoundBackplate(bounds) {
    let cube_x =
      bounds[1].x -
      bounds[0].x +
      (parseInt(params.paddingRight) + parseInt(params.paddingLeft));
    let cube_y =
      bounds[1].y -
      bounds[0].y +
      (parseInt(params.paddingTop) + parseInt(params.paddingBottom));
    let cube_2 = cube({
      size: [1000, 1000, params.backplateThickness]
    }).translate([-500, -500, 0]);
    let cube_1 = CSG.roundedCube({
      radius: [cube_x / 2, cube_y / 2, 10 + params.backplateThickness],
      roundradius: 10,
      resolution: 30
    }).translate([
      (-1 * params.paddingLeft) / 2,
      (-1 * params.paddingBottom) / 2,
      0
    ]);

    cube_1 = cube_1.intersect(cube_2);
    cube_1 = centerObject(cube_1);
    cube_1 = addPadding(cube_1);
    return cube_1;
  }

  function create_border(obj) {
    let border_width = params.borderWidth;
    let border_height = params.borderHeight;
    console.log(border_height / params.backplateThickness);
    let border = obj.scale([1, 1, border_height / params.backplateThickness]);

    let dim = getDimensions(obj);
    console.log(dim);
    let scale_x = 1 - border_width / dim.width;
    let scale_y = 1 - border_width / dim.height;
    console.log(scale_x + ' ' + scale_y);

    let border_cutout = obj
      .scale([scale_x, scale_y, 10])
      .translate([0, 0, -10]);
    border = difference(border, border_cutout);
    return border;
  }

  function getDimensions(obj) {
    let bounds = obj.getBounds();
    return {
      width: Math.abs(bounds[0].x) + Math.abs(bounds[1].x),
      height: Math.abs(bounds[0].y) + Math.abs(bounds[1].y)
    };
  }
};

export { getCode, getJscadIncludes, param_def };
