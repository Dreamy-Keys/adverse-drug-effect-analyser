'use client';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

export default function AgeRiskChart({ data, selectedAgeGroup }) {
  const chartData = data.map(item => ({
    name: item.label,
    score: item.riskScore,
    id: item.ageGroup,
    color: item.riskColor
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1f2e] border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-xs text-white/50 mb-2">Risk Score: <span className="text-white">{data.score}</span></p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            <span className="text-[10px] uppercase font-bold" style={{ color: data.color }}>
              {data.score <= 30 ? 'Low Risk' : data.score <= 70 ? 'Moderate' : 'High Risk'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
            interval={0}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                fillOpacity={entry.id === selectedAgeGroup ? 1 : 0.4}
                stroke={entry.id === selectedAgeGroup ? '#fff' : 'transparent'}
                strokeWidth={1}
              />
            ))}
          </Bar>
          <ReferenceLine y={30} stroke="rgba(16, 185, 129, 0.2)" strokeDasharray="3 3" />
          <ReferenceLine y={70} stroke="rgba(239, 68, 68, 0.2)" strokeDasharray="3 3" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
