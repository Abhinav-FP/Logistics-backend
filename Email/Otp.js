
module.exports = (otp, userName) => {
  return `
<table align="center" style="max-width: 600px; font-family: arial;" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">
<tr bgcolor="#cccccc">
  <td style="padding: 20px 2px 0 2px; text-align: center;">
    <p style="margin: 1px;">
      <a href="https://www.tracebill.com/">
        <img style="max-width:150px;" src="https://tracebill.com/Logo.png" alt="Tracebill Logo">
      </a>
    </p>
  </td>
</tr>
<tr bgcolor="#cccccc">
  <td style="padding: 40px 2px 10px 2px; text-align: center;">
    <p style="margin: 1px;">
      <img src="https://tracebill.com/ForgotPassword.png" alt="Forgot Password">
    </p>
  </td>
</tr>
<tr>
  <td style="padding:40px 0 20px 20px; text-align: left">
    <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000;   text-transform: capitalize;"> Hi ${userName}, </p>
  </td>
</tr>
<tr>
  <td style="padding: 0 0 20px 20px;">
    <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000;  text-align: left;"> You requested a password reset. Use the OTP below to proceed: </p>
  </td>
</tr>
<tr>
  <td style="padding: 0 0 30px 20px;">
    <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000;  text-align: left;"> Your OTP: <strong>${otp}</strong> </p>
  </td>
</tr>
<tr>
  <td style="padding: 0 20px 20px 20px; text-align: left">
    <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000"> For security reasons, this OTP will expire in 24 hours. If you didn’t request this reset, please contact our support team immediately </p>
  </td>
</tr>
<tr>
  <td style="padding: 0 0 20px 20px; text-align: left">
    <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000"> Thank you for using TraceBill! </p>
  </td>
</tr>
<tr>
  <td style="padding: 0 0 45px 20px; text-align: left">
      <p style="margin: 1px; font-size: 14px; font-weight: normal; color:#000000"> Warm regards,
, <br> The TraceBill Team 🌟</p>
  </td>
</tr>

    </table>
  </td>
</tr>
</table>
  `;
};
