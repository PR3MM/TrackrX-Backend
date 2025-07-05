// Creating a tracker which will track -
// 1. Count number of unique users using unique session IDs 
// 2. Count number of page views
// 3. Count number of unique users by user IP address
// 4. Referrers 
// 5. Top Pages
// 6. UTM Parameters	
// 7. Devices / OS
// 8. Browsers
// 9. Geolocation
// 10. Bounce Rate	
// 11. Scroll Depth
// 12. Click Heatmap
// 13 . Geolocation by IP address
// 14. Time on Page
// 
// This tracker will be used to track the above metrics and store them in a database
// for each url these metrics will be stored 
// for eg - https://example.com for this url the metrics will be stored in a database
// this file is only a script which will calculate the metrics and send them to the server
// the server will then store the metrics in a database
// the server will be a separate file which will handle the database operations
// tracker.js will be used to track the metrics and send them to the server


// Function to set a cookie with expiration
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Function to get a cookie value
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Function to generate a unique visitor ID
function generateVisitorId() {
    return 'visitor-' + Math.random().toString(36).substr(2, 16) + '-' + Date.now();
}

// Function to get or create visitor ID with 1-year TTL
function getVisitorId() {
    const existingVisitorId = getCookie('trackrx_visitor_id');
    
    if (existingVisitorId) {
        return existingVisitorId;
    }
    
    // Create new visitor ID and set cookie for 1 year (365 days)
    const newVisitorId = generateVisitorId();
    setCookie('trackrx_visitor_id', newVisitorId, 365);
    return newVisitorId;
}

// Function to generate a unique session ID 
// delete the session ID after 30 minutes of inactivity
function generateSessionId() {
    const sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem("sessionId", sessionId);
    sessionStorage.setItem("sessionCreatedAt", Date.now().toString());
    return sessionId;
}

// Function to get the session ID
function getSessionId() {
    const existingSessionId = sessionStorage.getItem("sessionId");
    const sessionCreatedAt = parseInt(sessionStorage.getItem("sessionCreatedAt"), 10);
    const now = Date.now();

    if (existingSessionId && sessionCreatedAt && (now - sessionCreatedAt < 30 * 60 * 1000)) {
        // Still valid session
        return existingSessionId;
    }

    // Expired or missing
    return generateSessionId();
}

// Function to get the user IP address
async function getUserIp() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching user IP:', error);
        return 'unknown';
    }
}

// Function to get the referrer
function getReferrer() {
    return document.referrer || 'direct';
}

// Function to get the current page URL
function getCurrentPage() {
    return window.location.href;
}
// Function to get UTM parameters from the URL
function getUtmParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        if (urlParams.has(param)) {
            utmParams[param] = urlParams.get(param);
        }
    });
    return utmParams;
}
// Function to get device and OS information
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'unknown';
    if (/mobile/i.test(userAgent)) {
        deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
        deviceType = 'tablet';
    } else if (/iPad|Android|Touch/.test(userAgent)) {
        deviceType = 'tablet';
    } else {
        deviceType = 'desktop';
    }
    let os = 'unknown';
    if (/Windows/i.test(userAgent)) {
        os = 'Windows';
    }
    else if (/Macintosh/i.test(userAgent)) {
        os = 'MacOS';
    } else if (/Linux/i.test(userAgent)) {
        os = 'Linux';
    } else if (/Android/i.test(userAgent)) {
        os = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        os = 'iOS';
    }
    return {
        deviceType,
        os
    };
    // return os;
}

// Function to get browser information
function getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browserName = 'unknown';
    if (/Chrome/i.test(userAgent)) {
        browserName = 'Chrome';
    }
    else if (/Firefox/i.test(userAgent)) {
        browserName = 'Firefox';
    }
    else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) {
        browserName = 'Safari';
    } else if (/Edge/i.test(userAgent)) {
        browserName = 'Edge';
    } else if (/MSIE|Trident/i.test(userAgent)) {
        browserName = 'Internet Explorer';
    }
    return {
        browserName,
        userAgent
    };
}
// Function to get geolocation based on IP address
async function getGeolocation() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        return {
            city: data.city || 'unknown',
            region: data.region || 'unknown',
            country: data.country_name || 'unknown',
            latitude: data.latitude || 0,
            longitude: data.longitude || 0
        };
        // return data.country_name || 'unknown';
    } catch (error) {
        console.error('Error fetching geolocation:', error);
        return {
            city: 'unknown',
            region: 'unknown',
            country: 'unknown',
            latitude: 0,
            longitude: 0
        };
    }
}

// Function to get scroll depth
function getScrollDepth() {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolledHeight = window.scrollY;
    const scrollDepth = (scrolledHeight / totalHeight) * 100;
    return Math.round(scrollDepth);
}
// Function to get click heatmap data
const clickHeatmap = [];

document.addEventListener('click', function (event) {
    const x = event.clientX;
    const y = event.clientY;
    clickHeatmap.push({ x, y });
});

// Function to get time spent on page
let timeOnPage = 0;
let pageLoadTime = Date.now();
function getTimeOnPage() {
    const currentTime = Date.now();
    timeOnPage = Math.round((currentTime - pageLoadTime) / 1000); // in seconds
    return timeOnPage;
}
// Function to calculate bounce rate
let isPageViewed = false;
function getBounceRate() {
    // If the user has interacted with the page, we consider it not a bounce
    if (isPageViewed) {
        return 0; // Not a bounce
    }
    // If the user leaves the page without interacting, we consider it a bounce
    return 1; // Bounce
}
// Function to send data to the server
async function sendDataToServer(data) {
    try {
        const response = await fetch('http://localhost:3001/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)  
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        console.log('Data sent successfully:', data);
    }
    catch (error) {
        console.error('Error sending data to server:', error);
    }

    // try {
    //     const url = 'http://localhost:3000/info';
    //     const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    //     navigator.sendBeacon(url, blob);
    // } catch (error) {
    //     console.error('sendBeacon failed:', error);
    // }
}
// Event listener to mark the page as viewed
document.addEventListener('DOMContentLoaded', () => {
    isPageViewed = true;
    // Start tracking time on page
    pageLoadTime = Date.now();
});

// Event listener to track scroll depth
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
            const scrollDepth = getScrollDepth();
            console.log('Scroll Depth:', scrollDepth + '%');
            scrollTimeout = null;
        }, 1000); // one update per second
    }
});

// Event listener to track clicks for heatmap
document.addEventListener('click', (event) => {
    const x = event.clientX;
    const y = event.clientY;
    console.log('Click at:', x, y);
});

// Event listener to track time on page
window.addEventListener('beforeunload', () => {
    const timeSpent = getTimeOnPage();
    console.log('Time spent on page:', timeSpent + ' seconds');
}
);

// Event listener to track bounce rate
window.addEventListener('beforeunload', () => {
    const bounceRate = getBounceRate();
    console.log('Bounce Rate:', bounceRate === 1 ? 'Bounce' : 'Not a Bounce');
}
);

// Event listener to track all metrics
window.addEventListener('beforeunload', () => {
    trackMetrics();
});


// main function to track the metrics by calling other functions and then sending the data to the server
async function trackMetrics() {
    // Get the visitor ID (unique user identifier with 1-year TTL)
    const totalVisitor = getVisitorId();
    
    // Get the session ID
    const sessionId = getSessionId();

    // Get the user IP address
    const userIp =  await getUserIp();

    // Get the referrer
    const referrer = document.referrer;

    // Get the current page URL
    // const currentPage = window.location.href;
    const url = new URL(window.location.href);
    const currentPage = url.host;

    // Get the website URL
    const websiteUrl = window.location.origin;

    // Get the pathname
    const pathname = window.location.pathname;

    // Get the UTM parameters
    const utmParameters = getUtmParameters();
    // Get the device and OS
    const deviceInfo = getDeviceInfo();
    // Get the browser information
    const browserInfo = getBrowserInfo();
    // Get the geolocation
    const geolocation = await getGeolocation();
    // Get the scroll depth
    const scrollDepth = getScrollDepth();
    // Get the time on page
    const timeOnPage = getTimeOnPage();
    // Get the bounce rate
    const bounceRate = getBounceRate();
    // current time
    const currentTime = new Date().toISOString();

    const data = {
        totalVisitor,
        sessionId,
        userIp,
        referrer,
        currentPage,
        pathname,
        websiteUrl,
        utmParameters,
        deviceInfo,
        // browserInfo,
        geolocation,
        scrollDepth,
        // clickHeatmap,
        timeOnPage,
        bounceRate,
        currentTime
    };
    // Send the data to the server
    console.log('Tracking data:', data);
    sendDataToServer(data);
}