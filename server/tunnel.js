const localtunnel = require("localtunnel");

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 5000, subdomain: "attendx-" + Math.floor(1000 + Math.random() * 9000) });
    console.log("MOBILE_TUNNEL_URL=" + tunnel.url);

    tunnel.on("close", () => {
      console.log("Tunnel closed, restarting in 3s...");
      setTimeout(startTunnel, 3000);
    });

    tunnel.on("error", (err) => {
      console.error("Tunnel error:", err.message);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.error("Failed to start tunnel:", err.message);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
