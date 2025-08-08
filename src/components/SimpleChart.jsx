// src/components/SimpleChart.jsx
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts'

export default function SimpleChart({ data }) {
    // Si no hay datos, mostrar mensaje
    if (!data || data.length === 0) {
        return <div className="text-gray-500 dark:text-gray-400">Sin datos para mostrar.</div>;
    }
    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                    }}
                />
                <Bar dataKey="value" fill="#3b82f6" barSize={40} />
            </BarChart>
        </ResponsiveContainer>
    )
}
