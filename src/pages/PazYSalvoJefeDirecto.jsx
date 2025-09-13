import React from 'react';
import PazYSalvoRoleView from '../components/PazYSalvoRoleView';

export default function PazYSalvoJefeDirecto() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <PazYSalvoRoleView userRole="JefeInmediato" />
            </div>
        </div>
    );
}
