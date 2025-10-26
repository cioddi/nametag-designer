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

const CookiePolicy = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid container justify="center" spacing={4}>
        <Grid item lg={6} xs={12}>
          <div className={classes.content}>
            <Typography variant="h1">Cookie Policy</Typography>
            <h2 className={classes.content}>
              nametag-designer.com (“Site”) uses cookies.
            </h2>

            <p className={classes.content}>
              We use cookies to personalize content and ads, to provide social
              media features and to analyze our traffic. We also share
              information about your use of our site with our social media,
              advertising and analytics partners who may combine it with other
              information that you’ve provided to them or that they’ve collected
              from your use of their services. You consent to our cookies if you
              continue to use our website.
            </p>

            <p className={classes.content}>
              A cookie is a small string of information that the website you
              visit transfers to your computer for identification purposes.
              Cookies can be used to follow your activity on the website and
              that information helps websites to understand your preferences and
              improve your website experience. Cookies are also used for such
              activities as remembering your user name and password, if you use
              such a feature on this Site. You can turn off all cookies in the
              event you prefer not to receive them. You can also have your
              computer warn you whenever cookies are being used. There are also
              software products available that can manage cookies for you.
              Please be aware, however, that when you choose to reject cookies,
              this choice may limit the functionality of the website and you may
              lose access to some of its features.{' '}
            </p>

            <p className={classes.content}>
              The law states that we can store cookies on your device if they
              are strictly necessary for the operation of this site. For all
              other types of cookies we need your permission.
            </p>

            <h2 className={classes.content}>Type of Cookies Used</h2>
            <p className={classes.content}>
              We use different types of cookies to run our Site. Some or all of
              the cookies identified below may be stored in your browser.
            </p>

            <table cellpadding="4px" border="1">
              <th>Type of Cookie</th>
              <th>Description</th>
              <tr>
                <td>Strictly Necessary Cookies</td>
                <td>
                  <br />
                  <br />
                  Strictly Necessary cookies are necessary for the operation of
                  our Site. These cookies are essential in helping you to move
                  around our Site and use the features, such as accessing secure
                  areas of the Site, or using the shopping basket.
                  <br />
                  <br />
                </td>
              </tr>
              <tr>
                <td>Performance Cookies</td>
                <td>
                  <br />
                  <br />
                  These cookies collect information about how visitors use our
                  services, for instance which pages visitors go to most often,
                  and if they get error messages from web pages. These cookies
                  collect anonymous information on the pages visited. All
                  information these cookies collect is aggregated and therefore
                  anonymous. It is only used to improve how our services
                  perform.
                  <br />
                  <br />
                  Web analytics that use cookies to gather data to enhance the
                  performance of a website fall into this category. For example,
                  they may be used for testing designs and ensuring a consistent
                  look and feel is maintained for the user. This category does
                  not include cookies used for behavioral/targeted advertising
                  networks.
                  <br />
                  <br />
                </td>
              </tr>
              <tr>
                <td>Functionality Cookies</td>
                <td>
                  <br />
                  <br />
                  These cookies allow the website to remember choices you make
                  (such as your user name, language or the region you are in)
                  and provide enhanced, more personal features. These cookies
                  can also be used to remember changes you have made to text
                  size, fonts and other parts of web pages that you can
                  customize. The information these cookies collect may be
                  anonymized and they cannot track your browsing activity on
                  other websites.
                  <br />
                  <br />
                  These cookies remember choices you make to improve your
                  experience.
                  <br />
                  <br />
                  If the same cookie is used for re-targeting they must be
                  included in the ‘Targeting or advertising cookies’ category as
                  well. It might also include cookies that are used to deliver a
                  specific function, but where that function includes cookies
                  used for behavioral/targeted advertising networks they must be
                  included in the ‘Targeting or advertising cookies’ category as
                  well as this category.
                  <br />
                  <br />
                </td>
              </tr>
              <tr>
                <td>Targeting Cookies</td>
                <td>
                  <br />
                  <br />
                  Targeting cookies help us make sure that the ads you see on
                  our Site are relevant to you and your interests. Targeting
                  cookies may also be placed on your device by our third party
                  service providers that remember you have visited the Site in
                  order to provide you with ads more relevant to you.
                  <br />
                  <br />
                </td>
              </tr>
            </table>
            <br />
            <p className={classes.content}>
              Many of the cookies placed through our Site are session cookies,
              while others are persistent cookies, and some are “first-party”
              cookies, while others are “third-party” cookies.
            </p>
            <ul>
              <li>
                <b>First-party cookies</b> are those set by a Site that is being
                visited by the user at the time (e.g., cookies placed by
                Nametag-designer.com).
              </li>
              <li>
                <b>Third-party cookies</b> are cookies that are set by a domain
                other than that of the Site being visited by the user. If a user
                visits a Site and another entity sets a cookie through that
                Site, this would be a third-party cookie.
              </li>
              <li>
                <b>Persistent cookies</b> are cookies that remain on a user’s
                device for the period of time specified in the cookie. They are
                activated each time that the user visits the Site that created
                that particular cookie.
              </li>
              <li>
                <b>Session cookies</b> are cookies that allow Site operators to
                link the actions of a user during a browser session. A browser
                session starts when a user opens the browser window and finishes
                when they close the browser window. Session cookies are created
                temporarily. Once you close the browser, all session cookies are
                deleted.
              </li>
            </ul>

            <h2 className={classes.content}>
              How to Manage and Delete Your Cookies
            </h2>
            <p className={classes.content}>
              Most Internet browsers are initially setup to automatically accept
              cookies. Unless you have adjusted your browser settings to refuse
              cookies, our system will issue cookies when you direct your
              browser to our Site. You can refuse to accept cookies by
              activating the appropriate setting on your browser. Please be
              aware that restricting the use of cookies will impact the
              functionality of our Site. As a result, you may be unable to
              access certain parts of our Site or use some of our products
              and/or services.
            </p>
            <p className={classes.content}>
              Depending on your browser, further information may be obtained via
              the following links:
            </p>
            <ul>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences"
                  target="_blank">
                  Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.google.com/chrome/bin/answer.py?hl=en&answer=95647"
                  target="_blank">
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://privacy.microsoft.com/en-us/privacystatement"
                  target="_blank">
                  Internet Explorer
                </a>
              </li>
              <li>
                <a
                  href="https://www.opera.com/browser/tutorials/security/privacy/"
                  target="_blank">
                  Opera
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                  target="_blank">
                  Safari
                </a>
              </li>
            </ul>

            <h2 className={classes.content}>Mobile Identifiers</h2>
            <p className={classes.content}>
              On your mobile device, your operating system may provide you with
              additional options to opt out of interest based advertising or to
              otherwise reset your mobile identifiers. For example, you may use
              the “Limit Ad Tracking” setting (on iOS devices) or a setting to
              “Opt out of Interest-Based Ads” (on Android devices) which allows
              you to limit the use of information about your use of apps for
              purposes of serving ads targeted to your interests.
            </p>
            <p className={classes.content}>
              To find out more about cookies, including how to see what cookies
              have been set and how to manage and delete them, visit{' '}
              <a href="http://www.aboutcookies.org" target="_blank">
                www.aboutcookies.org
              </a>{' '}
              or{' '}
              <a href="http://www.allaboutcookies.org" target="_blank">
                www.allaboutcookies.org
              </a>
              .
            </p>

            <h2 className={classes.content}>
              Web Beacons and Analytics Services
            </h2>
            <p className={classes.content}>
              Our Site may contain electronic images known as web beacons (or
              single-pixel gifs) that we use to help deliver cookies on our
              Site, count users who have visited the Site, and deliver content
              and advertising. We also include web beacons in our promotional
              email messages and newsletters to determine whether you open and
              act on them.
            </p>
            <p className={classes.content}>
              In addition to placing web beacons on our Site, we sometimes work
              with other companies to place our web beacons on their Sites or in
              their advertisements. T his helps us develop statistics on how
              often clicking on an advertisement results in a purchase or other
              action.
            </p>

            <h2 className={classes.content}>Targeting Cookies</h2>
            <p className={classes.content}>
              For cookies that track activity in connection with targeted
              advertising, you can opt-out:
            </p>
            <ul>
              <li>
                <b>EU Users:</b> A guide for EU users on behavioral advertising
                and online privacy has been produced by the internet advertising
                industry which can be found at:{' '}
                <a href="http://www.youronlinechoices.eu/" target="_blank">
                  http://www.youronlinechoices.eu/
                </a>
              </li>
              <li>
                <b>US Users:</b> To learn more about the use of cookies or other
                technologies to deliver more relevant advertising and to know
                your choices with respect to collection and use of the data by
                these third party tools, you may visit the Digital Advertising
                Alliance’s (DAA) opt-out page at{' '}
                <a href="http://www.aboutads.info/choices" target="_blank">
                  www.aboutads.info/choices
                </a>
                , or the National Advertising Initiative’s (NAI) opt-out page at{' '}
                <a
                  href="http://www.networkadvertising.org/choices/"
                  target="_blank">
                  http://www.networkadvertising.org/choices/
                </a>
              </li>
              <li>
                <b>Canadian Users:</b> visit{' '}
                <a href="http://www.youradchoices.ca/" target="_blank">
                  http://www.youradchoices.ca/
                </a>
              </li>
            </ul>
            <p className={classes.content}>
              Learn more about who we are, how you can contact us and how we
              process personal data in our <a href="/pp">Privacy Policy.</a>
            </p>

            <h2 className={classes.content}>Updates to this Policy</h2>
            <p className={classes.content}>
              We may occasionally make changes to this Policy. When we make
              material changes to this Policy, we’ll provide you with prominent
              notice e.g., by displaying a prominent notice within the Site or
              by sending you an email.{' '}
            </p>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default CookiePolicy;
