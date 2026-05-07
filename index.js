const dotenv = require("dotenv");
const data = require("./data");
const { sendBulkMails, verifyConnection } = require("./services/service");

dotenv.config();

const main = async () => {
  try {
    await verifyConnection();
    const results = await sendBulkMails(data);
    const sent = results.filter((result) => result.success).length;
    const failed = results.length - sent;

    console.log(`Bulk mail completed. Sent: ${sent}, Failed: ${failed}`);

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Bulk mail failed: ${error.message}`);
    process.exitCode = 1;
  }
};

main();
