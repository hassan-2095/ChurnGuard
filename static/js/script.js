document.addEventListener('DOMContentLoaded', function() {
    
    const form = document.getElementById('prediction-form');
    const randomBtn = document.getElementById('random-btn');
    let myChart = null;

    if (randomBtn) {
        randomBtn.addEventListener('click', function() {
            const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
            const randArr = (arr) => arr[Math.floor(Math.random() * arr.length)];

            document.getElementById('credit_score').value = randInt(350, 850);
            document.getElementById('geography').value = randArr(['France', 'Germany', 'Spain']);
            document.getElementById('gender').value = randArr(['Male', 'Female']);
            document.getElementById('age').value = randInt(18, 80);
            document.getElementById('tenure').value = randInt(0, 10);
            document.getElementById('balance').value = randInt(0, 200000);
            document.getElementById('num_of_products').value = randInt(1, 4);
            document.getElementById('estimated_salary').value = randInt(20000, 150000);
            document.getElementById('has_cr_card').checked = Math.random() > 0.3;
            document.getElementById('is_active_member').checked = Math.random() > 0.5;
        });
    }

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const geography = document.getElementById('geography').value;
            const gender = document.getElementById('gender').value;
            const age = parseFloat(document.getElementById('age').value);
            const tenure = parseInt(document.getElementById('tenure').value);
            const balance = parseFloat(document.getElementById('balance').value);
            const num_of_products = parseInt(document.getElementById('num_of_products').value);
            const credit_score = parseFloat(document.getElementById('credit_score').value);
            const estimated_salary = parseFloat(document.getElementById('estimated_salary').value);
            const has_cr_card = document.getElementById('has_cr_card').checked ? 1 : 0;
            const is_active_member = document.getElementById('is_active_member').checked ? 1 : 0;

            if (age < 18 || age > 100) { alert("❌ Logical Error: Age must be between 18 and 100."); return; }
            if ((age - tenure) < 18) { alert(`❌ Logical Error: Tenure is too high for this Age.`); return; }
            if (credit_score < 300 || credit_score > 850) { alert("❌ Logical Error: Credit Score must be 300-850."); return; }
            if (num_of_products < 1 || num_of_products > 4) { alert("❌ Logical Error: Products must be 1-4."); return; }
            if (balance < 0 || estimated_salary < 0 || tenure < 0) { alert("❌ Logical Error: Negative values not allowed."); return; }

            const formData = {
                geography: geography, gender: gender, age: age, tenure: tenure,
                balance: balance, num_of_products: num_of_products,
                credit_score: credit_score, estimated_salary: estimated_salary,
                has_cr_card: has_cr_card, is_active_member: is_active_member
            };

            const button = form.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;

            try {
                button.innerHTML = '<span class="spinner"></span> Analyzing...';
                button.disabled = true;

                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error("Server error");
                const data = await response.json();

                document.getElementById('result-section').style.display = 'block';
                document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });

                const probPercent = (data.probability * 100).toFixed(1);
                const probText = document.getElementById('prob-text');
                const statusText = document.getElementById('churn-status');
                const gauge = document.getElementById('gauge-ring');
                
                let color;
                if (data.result === 'Churn') {
                    color = 'var(--danger)';
                    statusText.innerText = 'Risk: HIGH (Likely to Churn)';
                    statusText.style.color = color;
                } else {
                    color = 'var(--success)';
                    statusText.innerText = 'Risk: LOW (Likely to Stay)';
                    statusText.style.color = color;
                }

                probText.innerText = `${probPercent}%`;
                probText.style.color = color;

                const degrees = data.probability * 360;
                gauge.style.background = `conic-gradient(${color} ${degrees}deg, #333 0deg)`;

                updateStrategies(data.probability);
                
                const drivers = data.risk_drivers;
                let driverArray = [
                    { label: 'Credit Score', value: drivers.CreditScore * 100 },
                    { label: 'Location', value: drivers.Geography * 100 },
                    { label: 'Gender', value: drivers.Gender * 100 },
                    { label: 'Age', value: drivers.Age * 100 },
                    { label: 'Tenure', value: drivers.Tenure * 100 },
                    { label: 'Balance', value: drivers.Balance * 100 },
                    { label: 'Product Count', value: drivers.NumOfProducts * 100 },
                    { label: 'Has Card', value: drivers.HasCrCard * 100 },
                    { label: 'Activity', value: drivers.IsActiveMember * 100 },
                    { label: 'Salary', value: drivers.EstimatedSalary * 100 }
                ];

                driverArray.sort((a, b) => b.value - a.value);

                const top3 = driverArray.slice(0, 3);
                
                const top3Labels = top3.map(d => d.label);
                const top3Data = top3.map(d => d.value);

                renderChart(top3Labels, top3Data);

                button.innerHTML = originalText;
                button.disabled = false;

            } catch (error) {
                console.error("Error:", error);
                alert("⚠️ An error occurred.");
                button.innerHTML = originalText;
                button.disabled = false;
            }
        });
    }

    function updateStrategies(probability) {
        const recList = document.getElementById('rec-list');
        recList.innerHTML = '';
        
        let bucket = Math.floor(probability * 10);
        if (bucket > 9) bucket = 9;

        const strategyMap = {
            0: [ "Send a 'Thank You' card.", "Offer 'Refer a Friend' bonuses.", "Invite to exclusive Beta testing.", "Highlight milestone achievements." ],
            1: [ "Upsell premium tiers.", "Suggest complementary products.", "Enable auto-renewal discount.", "Request an app store review." ],
            2: [ "Send educational content.", "Offer free consultation.", "Highlight community features.", "Promote annual billing." ],
            3: [ "Send personalized survey.", "Offer small perk for logging in.", "Remind of top 3 benefits.", "Check recent support tickets." ],
            4: [ "Assign success manager check-in.", "Offer 5% discount.", "Send success case study.", "Highlight unused features." ],
            5: [ "Offer 10-15% discount coupon.", "Prioritize support tickets.", "Send re-engagement email.", "Offer free temporary upgrade." ],
            6: [ "Direct phone call.", "Offer 20% discount for extension.", "Ask: 'How can we improve?'", "Waive pending fees." ],
            7: [ "Offer 30% discount.", "Provide 1-on-1 session.", "Send video message from manager.", "Unlock enterprise features." ],
            8: [ "Emergency outreach.", "Offer 50% discount.", "Pause subscription option.", "Escalate to senior manager." ],
            9: [ "Offer full 'Win-Back' package.", "Conduct exit interview.", "Send farewell message.", "Archive data safely." ]
        };

        const strategies = strategyMap[bucket] || ["Contact support."];
        strategies.forEach(item => {
            const li = document.createElement('li');
            li.innerText = item;
            recList.appendChild(li);
        });
    }

    function renderChart(labels, dataPoints) {
        const ctx = document.getElementById('importanceChart').getContext('2d');
        
        if (myChart) {
            myChart.destroy();
        }

        myChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Primary Risk Factors',
                    data: dataPoints,
                    backgroundColor: 'rgba(255, 42, 109, 0.2)',
                    borderColor: 'DeepPink',
                    pointBackgroundColor: 'DeepPink',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'DeepPink',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: {
                            color: 'WhiteSmoke',
                            font: { family: 'Orbitron', size: 12 }
                        },
                        ticks: {
                            display: false,
                            backdropColor: 'transparent'
                        },
                        suggestedMin: 0,
                        suggestedMax: 40
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        titleColor: 'DeepPink',
                        bodyColor: 'White',
                        borderColor: 'DimGray',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Risk Added: +${Math.round(context.raw)}%`;
                            }
                        }
                    }
                }
            }
        });
    }
});