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

const Tos = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={4}>
        <Grid item lg={6} xs={12}>
          <div className={classes.content}>
            <Typography variant="h1">Terms of service</Typography>
            <Typography variant="p">
              nametag-designer.com (“Nametag Designer”, “we”, and “us”)
              <br /> <br />
              You must be 13 years of age or older to use this site because of
              US online privacy laws concerning minors (COPPA).
              <br /> <br />
              1. Terms
              <br />
              This Website is provided by Nametag Designer. By accessing this
              website, you are agreeing to be bound by these Terms and
              Conditions of Use (“Terms and Conditions”), all applicable laws
              and regulations, and agree that you are responsible for compliance
              with any applicable local laws. We reserve the right, at our sole
              discretion, to change or modify portions of these Terms and
              Conditions at any time.
              <br /> <br />
              2. Intellectual Property
              <br />
              This website contains materials and other items relating to
              Nametag Designer and its products and services (the “Content”).
              The content may be in the form of information, data, text, images,
              graphics, registered and unregistered trademarks, illustrations,
              videos, software, audio clips, 3D models, or other forms.
              <br /> <br />
              All Content is copyrighted, and is either owned or used with
              permission by Nametag Designer. Except as set forth in this User
              Agreement, you may not reproduce, distribute, transmit, modify,
              adapt, translate, distribute, sell, license, publish, publicly
              perform, prepare derivative works based upon, or otherwise use or
              exploit the Content.
              <br /> <br />
              You may download copies of the materials (image
              capture/screenshots) on Nametag Designer' web site for personal,
              non-commercial use only. These personal, non-commercial purposes
              include networked and public viewing such as on social media. This
              is the grant of a license, not a transfer of title, and under this
              license you may not: use the materials for any commercial purpose;
              attempt to decompile or reverse engineer any software contained on
              Nametag Designer's web site; remove any copyright or other
              proprietary notations from the materials This license shall
              automatically terminate if you violate any of these restrictions.
              This license may be terminated by Nametag Designer at any time.
              Upon the termination of this license, you must destroy any
              downloaded materials in your possession whether in electronic or
              printed format.
              <br /> <br />
              Downloadable 3D Model Files
              <br />
              Nametag Designer offers or may offer for purchase downloadable 3D
              model files (“3D Models”). Except as expressly provided in these
              Terms, Nametag Designer retains all ownership, right, title, and
              interest in the 3D models. The 3D models may be printed or
              otherwise used for personal, noncommercial use and may not be
              resold, redistributed, or made available to third parties.
              Physical items printed from the 3D Models may not be sold or
              otherwise used commercially for any purpose, including as part of
              a larger project.
              <br /> <br />
              3. Disclaimer
              <br />
              The materials on Nametag Designer’s website are provided "as is".
              Nametag Designer makes no warranties, expressed or implied, and
              hereby disclaims and negates all other warranties, including
              without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights. Further, Nametag Designer does not warrant or make any
              representations concerning the accuracy, likely results, or
              reliability of the use of the materials on its Internet web site
              or otherwise relating to such materials or on any sites linked to
              this site.
              <br /> <br />
              4. Limitations
              <br />
              In no event shall Nametag Designer or its suppliers be liable for
              any damages (including, without limitation, damages for loss of
              data or profit, or due to business interruption,) arising out of
              the use or inability to use the materials on Nametag Designer’s
              Internet site, even if Nametag Designer or a Nametag Designer
              authorized representative has been notified orally or in writing
              of the possibility of such damage. Because some jurisdictions do
              not allow limitations on implied warranties, or limitations of
              liability for consequential or incidental damages, these
              limitations may not apply to you.
              <br /> <br />
              5. Revisions and Errata
              <br />
              The Content appearing on Nametag Designer’s website could include
              technical, typographical, or photographic errors. Nametag Designer
              does not warrant that any of the Content on its web site are
              accurate, complete, or current. Nametag Designer may make changes
              to the Content contained on its web site at any time without
              notice. Nametag Designer does not, however, make any commitment to
              update the Content.
              <br /> <br />
              6. Links
              <br />
              Nametag Designer has not reviewed all of the sites linked to its
              Internet web site and is not responsible for the contents of any
              such linked site. The inclusion of any link does not imply
              endorsement by Nametag Designer of the site. Use of any such
              linked web site is at the user's own risk.
              <br /> <br />
              7. Governing Law
              <br />
              The implementation of this agreement shall be exclusively governed
              by German law, even if foreign elements are involved.
            </Typography>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default Tos;
