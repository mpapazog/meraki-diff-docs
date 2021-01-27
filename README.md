# meraki-diff-docs
Documentation page for the Meraki Dashboard API that highlights limited access endpoints.

# The use case
This project is intended for experienced users of the Meraki Dashboard API, possibly members of the Developer Early Access Community. The project creates a minimalistic documentation page that uses red/green/orange colour coding to highlight which endpoints are in general availability status (and usable on all customer organisations) and which are visible through having enrolled into initiatives that provide access to extra endpoints, which might not be available to everyone. A typical example of endpoints highlighted in red are alpha/beta endpoints available through the Early Access programme.

# Project overview
The project creates a node.js web server, which provides the documentation page and handles communication with the Meraki Dashboard API.

# Prerequisites
To use this project, you will need the following:
* Two Meraki organizations:
- One with special API endpoints enabled, for example through participation in the Developer Early Access Program: https://developer.cisco.com/meraki/meraki-developer-early-access-program/
- One with no special features enabled. You can create a new blank organization for this use. You don't need to add devices or licenses
- Both organizations need to have Dashboard API access enabled 
* A Meraki dashboard administrator account with at least read access to both of these organisations and an API key

# Installation and startup
* Install node.js: https://nodejs.org/en/
* Copy the contents or this repository to your server
* Edit file **/config/config.yaml**
* Find the following text:
```
merakiDashboardAPI:
    # Modify to match your Meraki Dashboard API key
    apiKey: "1234"
    
    # Modify to match the organization where NO special API endpoints are enabled
    generalAvailabilityOrganization: 
        id: "4567"
        
    # Modify to match the organization where special API endpoints are enabled
    betaOrganization:
        id: "7890"
```
* Replace the contents of the strings to match your environment
* In the installation directory, run the following commands:
```
npm install
node server.js
```
* By default, the server will run on TCP port 8080, and the documentation page can be accessed by navigating with a web browser (Firefox recommended) to:
```
http://yourServersIpAddress:8080
```
* If you prefer a different colour scheme, or the fonts and elements don't render properly on your screen, feel free to edit the stylesheet found at **/html/css/style.css** to your liking

# Enabling authentication
By default, authentication is disabled in the configuration file. **It is highly recommended that you set up a HTTPS reverse proxy if you enable authentication, to avoid credentials' leak.**

To enable authentication:
* Edit file **/config/config.yaml**
* Find the following text:
```
authentication:
    # Optional: Modify this to enable HTTP basic authentication
    # NOTE: A HTTPS reverse proxy is highly advised to protect credentials in transit
    required: false
```
* Modify the value to **required: true**
* Edit file **/config/users.csv**
* Add credentials in the form **username,password**

# Screenshot
![alt screenshot](diff-docs-screenshot.png)

# Useful links
The official Meraki API developer page: https://developer.cisco.com/meraki
