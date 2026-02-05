const { withAndroidManifest, withMainApplication } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withVpnService = (config) => {
  // Add VPN service to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application[0];

    // Add VPN service
    if (!application.service) {
      application.service = [];
    }

    // Check if service already exists
    const serviceExists = application.service.some(
      service => service.$['android:name'] === '.DnsVpnService'
    );

    if (!serviceExists) {
      application.service.push({
        $: {
          'android:name': '.DnsVpnService',
          'android:permission': 'android.permission.BIND_VPN_SERVICE',
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.net.VpnService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  // Add native Java files
  config = withMainApplication(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const androidPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'dnsbrowser', 'app');

    // Ensure directory exists
    if (!fs.existsSync(androidPath)) {
      fs.mkdirSync(androidPath, { recursive: true });
    }

    // Copy VPN module files
    const vpnModulePath = path.join(__dirname, '..', 'android-vpn-implementation', 'VpnModule.java');
    const vpnServicePath = path.join(__dirname, '..', 'android-vpn-implementation', 'DnsVpnService.java');

    const targetModulePath = path.join(androidPath, 'VpnModule.java');
    const targetServicePath = path.join(androidPath, 'DnsVpnService.java');

    // Copy files if they exist
    if (fs.existsSync(vpnModulePath)) {
      // Read and update package name
      let moduleContent = fs.readFileSync(vpnModulePath, 'utf8');
      moduleContent = moduleContent.replace(/package com\.dnsbrowserapp;/g, 'package com.dnsbrowser.app;');
      fs.writeFileSync(targetModulePath, moduleContent);
    }

    if (fs.existsSync(vpnServicePath)) {
      // Read and update package name
      let serviceContent = fs.readFileSync(vpnServicePath, 'utf8');
      serviceContent = serviceContent.replace(/package com\.dnsbrowserapp;/g, 'package com.dnsbrowser.app;');
      fs.writeFileSync(targetServicePath, serviceContent);
    }

    return config;
  });

  return config;
};

module.exports = withVpnService;
