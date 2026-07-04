'use client';

import { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckSquare, FileText } from 'lucide-react';

export default function AiInsights({ data, activeTab = 'Overall' }) {
  const insights = useMemo(() => {
    if (data.length === 0) return [];

    const inData = data.filter(d => d.source_type === 'IN');
    const validData = data.filter(d => d.source_type === 'VALID');
    const backlogData = data.filter(d => d.source_type === 'BACKLOG');

    const totalIn = inData.length;
    const totalValid = validData.length;
    const totalBacklog = backlogData.length;

    const list = [];

    // Helper to get top entity
    const getTopEntity = (dataset, field) => {
      if (!dataset.length) return null;
      const counts = {};
      dataset.forEach(d => {
        const val = d[field];
        if (val) counts[val] = (counts[val] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted[0] ? { name: sorted[0][0], count: sorted[0][1] } : null;
    };

    // ── OVERALL TAB INSIGHTS ──────────────────────────────────────────────────
    if (activeTab === 'Overall') {
      const topOfficer = getTopEntity(validData, 'officer');
      if (topOfficer) {
        list.push({
          type: 'success',
          icon: <TrendingUp size={15} className="text-green-400" />,
          text: `Officer *${topOfficer.name}* memimpin produktivitas C1 dengan mencatatkan *${topOfficer.count}* aplikasi VALID.`,
        });
      }

      const topBacklogDealer = getTopEntity(backlogData, 'dealer');
      if (topBacklogDealer && topBacklogDealer.count > 1) {
        list.push({
          type: 'warning',
          icon: <AlertTriangle size={15} className="text-amber-400" />,
          text: `Dealer *${topBacklogDealer.name}* menyumbang backlog terbanyak (*${topBacklogDealer.count}* berkas). Butuh follow-up segera.`,
        });
      }

      const acpCount = validData.filter(d => d.acp === 'ACP').length;
      const acpPct = totalValid > 0 ? Math.round((acpCount / totalValid) * 100) : 0;
      list.push({
        type: 'info',
        icon: <Lightbulb size={15} className="text-cyan-400" />,
        text: `Penetrasi ACP saat ini berada di angka *${acpPct}%* (${acpCount} dari total ${totalValid} aplikasi Valid).`,
      });

      list.push({
        type: 'action',
        icon: <Sparkles size={15} className="text-purple-400" />,
        text: totalBacklog > totalValid 
          ? `Jumlah backlog (*${totalBacklog}*) lebih tinggi dari aplikasi valid. Prioritaskan koordinasi penyelesaian berkas pending.`
          : `Aliran data C1 berjalan seimbang. Teruskan pemantauan harian berkas IN baru agar segera dieksekusi.`,
      });
    }

    // ── IN TAB INSIGHTS ───────────────────────────────────────────────────────
    if (activeTab === 'IN') {
      const topDealerIn = getTopEntity(inData, 'dealer');
      if (topDealerIn) {
        list.push({
          type: 'info',
          icon: <FileText size={15} className="text-cyan-400" />,
          text: `Dealer *${topDealerIn.name}* menjadi supplier aplikasi masuk (IN) terbanyak hari ini dengan *${topDealerIn.count}* berkas.`,
        });
      }

      const topOfficerIn = getTopEntity(inData, 'officer');
      if (topOfficerIn) {
        list.push({
          type: 'success',
          icon: <TrendingUp size={15} className="text-green-400" />,
          text: `Officer *${topOfficerIn.name}* sedang memproses aplikasi masuk terbanyak (*${topOfficerIn.count}* berkas IN).`,
        });
      }

      const tegalIn = inData.filter(d => d.wilayah === 'Tegal').length;
      const pklIn = inData.filter(d => d.wilayah === 'Pekalongan').length;
      list.push({
        type: 'warning',
        icon: <Lightbulb size={15} className="text-amber-400" />,
        text: `Distribusi aplikasi masuk: Wilayah Tegal menyumbang *${tegalIn}* berkas, Pekalongan menyumbang *${pklIn}* berkas.`,
      });

      list.push({
        type: 'action',
        icon: <Sparkles size={15} className="text-purple-400" />,
        text: `Pastikan semua berkas IN yang baru masuk segera divalidasi kelengkapan dokumennya untuk mempercepat proses persetujuan.`,
      });
    }

    // ── VALID TAB INSIGHTS ────────────────────────────────────────────────────
    if (activeTab === 'VALID') {
      const topDealerValid = getTopEntity(validData, 'dealer');
      if (topDealerValid) {
        list.push({
          type: 'success',
          icon: <CheckSquare size={15} className="text-green-400" />,
          text: `Pencapaian Go Live tertinggi dicapai oleh dealer *${topDealerValid.name}* dengan *${topDealerValid.count}* aplikasi VALID.`,
        });
      }

      const acpCount = validData.filter(d => d.acp === 'ACP').length;
      const acpPct = totalValid > 0 ? Math.round((acpCount / totalValid) * 100) : 0;
      list.push({
        type: 'info',
        icon: <Lightbulb size={15} className="text-cyan-400" />,
        text: `Dari total *${totalValid}* aplikasi valid, sebanyak *${acpCount}* (*${acpPct}%*) menggunakan paket perlindungan ACP.`,
      });

      list.push({
        type: 'action',
        icon: <Sparkles size={15} className="text-purple-400" />,
        text: acpPct < 50
          ? `Penetrasi ACP masih di bawah 50% (*${acpPct}%*). Dorong Officer untuk lebih aktif mempromosikan keuntungan ACP ke dealer.`
          : `Penetrasi ACP sudah sangat baik (*${acpPct}%*). Pertahankan konsistensi penawaran program perlindungan ini.`,
      });
    }

    // ── BACKLOG TAB INSIGHTS ──────────────────────────────────────────────────
    if (activeTab === 'BACKLOG') {
      const topDealerBacklog = getTopEntity(backlogData, 'dealer');
      if (topDealerBacklog) {
        list.push({
          type: 'warning',
          icon: <AlertTriangle size={15} className="text-orange-400" />,
          text: `Dealer *${topDealerBacklog.name}* memiliki tumpukan backlog terbanyak saat ini (*${topDealerBacklog.count}* berkas pending).`,
        });
      }

      const topOfficerBacklog = getTopEntity(backlogData, 'officer');
      if (topOfficerBacklog) {
        list.push({
          type: 'info',
          icon: <Lightbulb size={15} className="text-cyan-400" />,
          text: `Officer *${topOfficerBacklog.name}* memegang tanggung jawab backlog terbesar (*${topOfficerBacklog.count}* berkas pending).`,
        });
      }

      list.push({
        type: 'action',
        icon: <Sparkles size={15} className="text-purple-400" />,
        text: totalBacklog > 0
          ? `Gunakan tombol share WhatsApp di menu detail Officer/Dealer untuk langsung menagih penyelesaian backlog hari ini.`
          : `Luar biasa! Tidak ada aplikasi backlog yang terdeteksi saat ini. Semua berkas telah diproses dengan bersih.`,
      });
    }

    return list;
  }, [data, activeTab]);

  const formatText = (text) => {
    return text.split('*').map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} style={{ color: '#ffffff', fontWeight: 700 }}>{part}</strong>;
      }
      return part;
    });
  };

  if (data.length === 0) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden', padding: '1.25rem' }}>
      <div style={{
        position: 'absolute', top: '-50%', right: '-10%', width: '180px', height: '180px',
        background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 75%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', position: 'relative', zIndex: 1 }}>
        <Sparkles size={18} className="text-primary-theme animate-pulse" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
          Executive Insights — Tab {activeTab}
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative', zIndex: 1 }}>
        {insights.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <div style={{ marginTop: '0.1rem' }}>{item.icon}</div>
            <p style={{ lineHeight: '1.35', margin: 0 }}>{formatText(item.text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
