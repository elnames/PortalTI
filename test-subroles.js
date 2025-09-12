const axios = require('axios');

async function testSubroles() {
    try {
        console.log('🔍 Probando sistema de subroles...');

        // Login como admin
        const loginResponse = await axios.post('http://localhost:5266/api/auth/login', {
            username: 'admin',
            password: 'admin'
        });

        const adminToken = loginResponse.data.token;
        console.log('✅ Login como admin exitoso');

        // Login como Javier (que tiene subroles)
        const javierLogin = await axios.post('http://localhost:5266/api/auth/login', {
            username: 'javier.jorquera@vicsa.cl',
            password: 'admin1'
        });

        const javierToken = javierLogin.data.token;
        console.log('✅ Login como Javier exitoso');

        // Probar endpoint de subroles como Javier
        console.log('\n🔍 Obteniendo subroles de Javier...');
        const subRolesResponse = await axios.get('http://localhost:5266/api/pazysalvoroles/user-subroles', {
            headers: { 'Authorization': `Bearer ${javierToken}` }
        });

        console.log('✅ Subroles de Javier:');
        if (subRolesResponse.data && subRolesResponse.data.length > 0) {
            subRolesResponse.data.forEach(subrole => {
                console.log(`   - ${subrole.rol} (${subrole.departamento}) - Activo: ${subrole.isActive}`);
            });
        } else {
            console.log('   - No tiene subroles asignados');
        }

        // Probar endpoint de subroles como admin (no debería tener subroles)
        console.log('\n🔍 Obteniendo subroles del admin...');
        const adminSubRolesResponse = await axios.get('http://localhost:5266/api/pazysalvoroles/user-subroles', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        console.log('✅ Subroles del admin:');
        if (adminSubRolesResponse.data && adminSubRolesResponse.data.length > 0) {
            adminSubRolesResponse.data.forEach(subrole => {
                console.log(`   - ${subrole.rol} (${subrole.departamento}) - Activo: ${subrole.isActive}`);
            });
        } else {
            console.log('   - No tiene subroles asignados (correcto para admin)');
        }

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        if (error.response?.status) {
            console.error('Status:', error.response.status);
        }
    }
}

testSubroles();
