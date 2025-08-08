// src/components/Card.jsx
export default function Card({ title, value, icon: Icon, color = 'blue' }) {
    const colorClasses = {
        blue: 'text-blue-500',
        green: 'text-green-500',
        orange: 'text-orange-500',
        purple: 'text-purple-500',
        yellow: 'text-yellow-500',
        red: 'text-red-500',
        gray: 'text-gray-500'
    };

    const iconColor = colorClasses[color] || colorClasses.blue;

    return (
        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg dark:shadow-gray-900/20 p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
            {Icon && <Icon className={`w-8 h-8 ${iconColor}`} />}
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
