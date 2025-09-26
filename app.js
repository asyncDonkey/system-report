const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// CHARTS SETUP
// Main chart (CPU Temp, CPU Load, Estimated Watts)
const mainCtx = document.getElementById('mainChart').getContext('2d');
const mainChart = new Chart(mainCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Temp (°C)', data: [], borderColor: '#e74c3c', yAxisID: 'yTemp'
        }, {
            label: 'CPU Usage (%)', data: [], borderColor: '#3498db', yAxisID: 'yPercent'
        }, {
            label: 'Estimated Consumption (W)', data: [], borderColor: '#f1c40f', yAxisID: 'yWatts'
        }]
    },
    options: {
        responsive: true,
        animation: { duration: 250 },
        scales: {
            yTemp: { type: 'linear', position: 'left', beginAtZero: true, title: { display: true, text: '°C' } },
            yPercent: { type: 'linear', position: 'right', beginAtZero: true, max: 100, title: { display: true, text: '%' } },
            yWatts: { display: false } // Hidden Axis, but data is used and present 
        }
    }
});

// RAM Usage Chart
const ramCtx = document.getElementById('ramChart').getContext('2d');
const ramChart = new Chart(ramCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'RAM Usage (%)', data: [], borderColor: '#2ecc71', backgroundColor: 'rgba(46, 204, 113, 0.2)', fill: true
        }]
    },
    options: {
        responsive: true,
        animation: { duration: 250 },
        scales: { y: { beginAtZero: true, max: 100 } }
    }
});

// HTML REFERENCES
const processStatusDiv = document.getElementById('processStatus');

// FIREBASE LISTENER
const readingsRef = database.ref('readings').limitToLast(1);

readingsRef.on('child_added', (snapshot) => {
    const reading = snapshot.val();
    const timestamp = new Date(reading.timestamp * 1000).toLocaleTimeString('it-IT');
    const maxDataPoints = 30; // Number of points to show on the chart

    // Generic function to update chart data
    function updateChartData(chart, label, datasetsData) {
        chart.data.labels.push(label);
        datasetsData.forEach((dataPoint, index) => {
            chart.data.datasets[index].data.push(dataPoint);
        });

        if (chart.data.labels.length > maxDataPoints) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(dataset => dataset.data.shift());
        }
        chart.update();
    }

    // Update charts with new data
    updateChartData(mainChart, timestamp, [reading.cpu_temperature, reading.cpu_load, reading.estimated_watts]);
    updateChartData(ramChart, timestamp, [reading.ram_usage]);

    // Update process status
    let statusHtml = '';
    // Alphabetical sorting of process names for consistent display
    const sortedProcesses = Object.keys(reading.processes).sort();

    for (const processName of sortedProcesses) {
        const isRunning = reading.processes[processName];
        const color = isRunning ? '#2ecc71' : '#e74c3c';
        const text = isRunning ? 'ACTIVE' : 'NOT ACTIVE';
        statusHtml += `<p>${processName} <span class="status-dot" style="color: ${color};">${text}</span></p>`;
    }
    processStatusDiv.innerHTML = statusHtml;
});