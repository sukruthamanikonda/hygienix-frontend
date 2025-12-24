(async () => {
    const base = 'http://localhost:5001';
    try {
        console.log('Testing Authentication...');
        const loginRes = await fetch(base + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@hygienix.in', password: 'admin123' })
        });
        const loginJson = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginJson.error);
        console.log('Token acquired.');

        const ordersRes = await fetch(base + '/api/orders/admin', {
            headers: { Authorization: `Bearer ${loginJson.token}` }
        });
        const ordersJson = await ordersRes.json();
        console.log('Orders found:', ordersJson.length);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
})();
