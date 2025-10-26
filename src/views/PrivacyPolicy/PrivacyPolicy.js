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

const PrivacyPolicy = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={4}>
        <Grid item lg={6} xs={12}>
          <div className={classes.content}>
            <Typography variant="h1">Privacy Policy</Typography>
            <Typography variant="p">
              nametag-designer.com (“Nametag Designer”, “we”, and “us”)
              <br /> <br />
              Effective Date: This Privacy Policy is effective and was last
              updated as of January 23, 2020.
              <br /> <br />
              <b>This Privacy Policy describes:</b>
              <br /> <br />
              how and why we collect certain information from you via the
              Website and the online services provided through the Website;
              <br />
              how we use and with whom we share such information;
              <br />
              how you can access and update such information; and
              <br />
              the choices you can make about how we collect, use and share your
              information
              <br /> <br />
              <b>Changes to Our Privacy Policy</b>
              <br /> <br />
              If we decide to make material changes to our Privacy Policy, we
              will notify you by sending a notice to the email address that you
              have provided in connection with your Nametag Designer account
              and/or by updating the Privacy Policy on our website and linking
              to it from our home page.
              <br /> <br />
              <b>Information We Collect</b>
              <br />
              <br />
              In order to purchase a Nametag Designer Model, you must provide
              the following personal information:
              <br />
              - your email address
              <br />
              - credit card information which will be used to complete purchases
              from our website (these information will at no time be handled by
              Nametag Designer)
              <br />
              - Models created using our software are not considered personal or
              private information. We treat these designs as public information
              which may be used or displayed publicly on our site, on other
              sites, in print, or in real life.
              <br /> <br />
              <b>Cookies:</b>
              <br />
              We use cookies (or other similar technology), which are pieces of
              data on your computer tied to information about you which
              recognize you as a return user of the Website and help to provide
              a more personalized experience. Because we do not track personal
              information, we do not respond to do not track signals when a Do
              Not Track (DNT) browser mechanism is in place.
              <br /> <br />
              <b>How We Use and Share Your Personal Information</b>
              <br /> <br />
              We may use the personal information we collect:
              <br />
              - to fulfill your purchases of Nametag Designer offerings;
              <br />
              - in order to contact you about your order or account, or to
              respond to your requests for customer support;
              <br />
              - to provide you with information regarding changes to the Nametag
              Designer website; and
              <br />
              - to inform you of any product or promotional offers we may have.
              <br />
              - We may share your personal information in the following ways:
              <br />
              - to third-party companies to perform services on our behalf,
              including marketing assistance, email delivery, hosting services,
              customer service, and data analysis. We require all such
              third-party service providers to not use your personal information
              for any purpose other than to provide services to us.
              <br />
              - to comply with any applicable, law, regulation, legal process or
              government request, to enforce our rights or to protect the safety
              and security of our website and users.
              <br />
              - In the event Nametag Designer undergoes a business transaction,
              such as a merger, acquisition by another company, or sale of all
              or a portion of its assets, we may transfer your personal
              information to the successor organization in such transaction.
              <br /> <br />
              <b>Google Analytics</b>
              <br />
              Google Analytics is a web analysis service provided by Google. It
              utilizes the cookie and usage data of visitors to this website to
              track and examine the use of this URL and to prepare reports on
              the activities and performance of this URL and share them with
              other Google services. Google may use the data collected to
              contextualize and personalize the ads of its own advertising
              network. Read Google's privacy policy for more information. We,
              along with third-party vendors such as Google, use cookies or
              other identifiers to compile data regarding user interactions with
              ad impressions, and other ad service functions as they relate to
              our website.
              <br /> <br />
              <b>Opting out:</b>
              <br />
              Users can set preferences for how Google advertises to you using
              the Google Ad Settings page. Alternatively, you can opt out by
              visiting the Network Advertising initiative opt out page or
              permanently using the Google Analytics Opt Out Browser add on.
              <br /> <br />
              <b>Children Under 13</b>
              <br />
              This Website is not intended for children under the age of 13 and
              we do not knowingly collect any personal information from such
              children. Children under the age of 13 should not use our Website
              or our online services at any time. In the event that we learn
              that we have inadvertently gathered personal information from
              children under the age of 13, we will use reasonable efforts to
              erase such information from our records.
            </Typography>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default PrivacyPolicy;
