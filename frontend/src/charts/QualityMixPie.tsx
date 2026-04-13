
import { ResponsivePie } from '@nivo/pie';

interface Props { 
  data: { association: number; fallback: number }; 
}

const theme = {
  labels: { text: { fill: '#475569', fontSize: 11, fontWeight: 600 } },
  tooltip: { container: { background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)', color: '#1e293b', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } },
};

export default function QualityMixPie({ data }: Props) {
  const formatted = [
    { id: 'Association', label: 'Association', value: data.association, color: '#6378ff' },
    { id: 'Fallback', label: 'Fallback', value: data.fallback, color: '#cbd5e1' },
  ];

  return (
    <div style={{ height: 280 }}>
      <ResponsivePie
        data={formatted}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={4}
        colors={{ datum: 'data.color' }}
        enableArcLabels={true}
        arcLabelsTextColor="#ffffff"
        arcLabelsSkipAngle={10}
        theme={theme}
        animate
      />
    </div>
  );
}
