'use client';

// Timeline Customer Journey — porting statico di ggdb_cj_design.
// Le journey, fasi, delay e canali sono "cablati" come nell'originale
// (era un HTML statico, non generato dai dati). Fedele all'originale.

const Ico = ({ type }: { type: 'email' | 'mms' | 'sms' | 'task' | 'wechat' | 'bolt' }) => {
  const common = { fill: 'none', stroke: '#3a2e1a', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'email') return <svg viewBox="0 0 24 24" {...common}><rect x="2.5" y="5.5" width="19" height="13" rx="1.8" /><path d="M2.5 7.5 L12 13.5 L21.5 7.5" /></svg>;
  if (type === 'mms') return <svg viewBox="0 0 24 24" {...common}><rect x="6.5" y="2" width="11" height="20" rx="2.2" /><rect x="8.5" y="5" width="7" height="10" rx="1" /><polyline points="8.5,14 10.8,11 12.8,13 14.5,11.2 15.5,14" /></svg>;
  if (type === 'sms') return <svg viewBox="0 0 24 24" {...common}><rect x="6.5" y="2" width="11" height="20" rx="2.2" /><rect x="8" y="5.5" width="8" height="7.5" rx="1.4" /><line x1="9.5" y1="8" x2="14.5" y2="8" /><line x1="9.5" y1="10" x2="13" y2="10" /></svg>;
  if (type === 'task') return <svg viewBox="0 0 24 24" {...common}><rect x="5.5" y="4.5" width="13" height="16.5" rx="1.4" /><rect x="8.5" y="3" width="7" height="3" rx="1" /><polyline points="9,14 11.2,16.2 15.5,11" strokeWidth={1.8} /></svg>;
  if (type === 'wechat') return <svg viewBox="0 0 24 24" {...common}><path d="M3.5 10 Q3.5 5.5 9.5 5.5 Q15.5 5.5 15.5 10 Q15.5 14.5 9.5 14.5 Q8 14.5 6.5 14 L4 15.5 L4.8 13.2 Q3.5 12 3.5 10 Z" /></svg>;
  return <svg viewBox="0 0 24 24" fill="#d4a030" stroke="#9a6a10" strokeWidth={0.6}><polygon points="13.5,2 5,13.5 12,13.5 10.5,22 20,10 13,10" /></svg>;
};

const Delay = ({ children }: { children: React.ReactNode }) => <span className="tl-delay">{children}</span>;
const Nrt = () => <span className="tl-nrt">NRT</span>;

// Una journey = etichetta + barra-freccia con le sue icone/delay.
function Journey({
  label, left, width, below, children,
}: { label: string; left: string; width: string; below?: boolean; children: React.ReactNode }) {
  return (
    <>
      <div className={`tl-label${below ? ' below' : ''}`} style={{ left }}>{label}</div>
      <div className="tl-arrow" style={{ left, width }}>
        <div className="tl-arrow-inner" />
        <div className="tl-arrow-white">{children}</div>
        <div className="tl-arrow-tip" />
      </div>
    </>
  );
}

export default function CjTimeline() {
  return (
    <div className="cj-timeline-wrap">
      <div className="cj-timeline">
        <div className="tl-phase-headers">
          <div className="tl-phase ph-1">Acquisition</div>
          <div className="tl-phase ph-2">Conversion</div>
          <div className="tl-phase ph-3">Purchase</div>
          <div className="tl-phase ph-4">Cross-Sell &amp; Engage</div>
          <div className="tl-phase ph-5">Retention &amp; Winback</div>
        </div>

        <div className="tl-canvas">
          <div className="tl-columns">
            <div className="tl-col c1" /><div className="tl-col c2" /><div className="tl-col c3" />
            <div className="tl-col c4" /><div className="tl-col c5" />
          </div>

          <div className="tl-grid">
            <div className="tl-row">
              <Journey label="Welcome" left="1.8%" width="38%" below>
                <Nrt /><Ico type="email" /><Ico type="mms" /><Delay>+2/5 Days</Delay>
                <Ico type="email" /><Ico type="mms" /><Delay>+3 Days</Delay>
                <Ico type="email" /><Delay>+23 Days</Delay><Ico type="email" /><Ico type="mms" />
                <Delay>+7 Days</Delay><Ico type="email" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Thank You Generic" left="41.5%" width="18%">
                <Ico type="email" /><Delay>+2 Days</Delay><Ico type="mms" /><Delay>+1 Day</Delay><Ico type="task" />
              </Journey>
              <Journey label="Thank You Reco" left="61.5%" width="18%">
                <Ico type="email" /><Ico type="mms" /><Ico type="task" /><Delay>+60 Days</Delay>
                <Ico type="email" /><Ico type="mms" /><Ico type="task" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Abandoned Cart" left="21.5%" width="16%">
                <Ico type="bolt" /><Ico type="email" /><Delay>+2 Days</Delay><Ico type="email" />
              </Journey>
              <Journey label="NPS Post Purchase/Service" left="41.5%" width="18%">
                <Ico type="sms" /><Ico type="wechat" /><Ico type="email" /><Delay>+3 Days</Delay><Ico type="task" />
              </Journey>
              <Journey label="Concierge" left="61.5%" width="18%">
                <Ico type="task" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Notify Me" left="21.5%" width="18%">
                <Ico type="bolt" /><Ico type="email" /><Delay>+2 Days</Delay><Ico type="email" />
                <Delay>+7 Days</Delay><Ico type="email" /><Delay>+7 Days</Delay><Ico type="email" />
              </Journey>
              <Journey label="Product Lifecycle" left="61.5%" width="18%">
                <Ico type="email" /><Delay>+2 Days</Delay><Ico type="email" />
              </Journey>
              <Journey label="CJ Noos" left="81.5%" width="17%">
                <Ico type="email" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="NPS Post Service Completion" left="41.5%" width="18%">
                <Ico type="sms" /><Ico type="wechat" /><Ico type="email" /><Delay>+3 Days</Delay><Ico type="sms" />
              </Journey>
              <Journey label="Collectors" left="61.5%" width="18%">
                <Ico type="email" /><Delay>+1 month</Delay><Ico type="email" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Be Golden" left="21.5%" width="18%">
                <Ico type="email" /><Delay>+5 Days</Delay><Ico type="email" />
              </Journey>
              <Journey label="NPS Repair Online" left="41.5%" width="18%">
                <Delay>+7 Days</Delay><Ico type="email" /><Ico type="sms" />
              </Journey>
              <Journey label="NPS CCare" left="61.5%" width="18%">
                <Ico type="bolt" /><Delay>+3 Days</Delay><Ico type="email" />
              </Journey>
              <Journey label="Re-engagement" left="81.5%" width="17%">
                <Ico type="task" /><Delay>+7 Days</Delay><Ico type="email" /><Delay>+2 Days</Delay>
                <Ico type="email" /><Delay>+5 Days</Delay><Ico type="email" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Kids" left="61.5%" width="18%">
                <Ico type="email" /><Delay>+3 Days</Delay><Ico type="bolt" /><Ico type="email" />
              </Journey>
            </div>

            <div className="tl-row">
              <Journey label="Trustpilot" left="41.5%" width="18%">
                <Ico type="email" /><Ico type="sms" />
              </Journey>
            </div>
          </div>

          <div className="tl-persistent">
            <div className="tl-pbar"><span className="tl-plabel" style={{ left: '18%' }}>Task_ChangePSA_Automated</span><span className="tl-pcontent" style={{ left: '31%' }}><Ico type="task" /></span></div>
            <div className="tl-pbar"><span className="tl-plabel" style={{ left: '18%' }}>Task_ChangePS</span><span className="tl-pcontent" style={{ left: '27%' }}><Ico type="task" /></span></div>
            <div className="tl-pbar"><span className="tl-plabel" style={{ left: '18%' }}>Birthday</span><span className="tl-pcontent" style={{ left: '25%' }}><Ico type="task" /><Delay>+20 Days</Delay><Ico type="email" /></span></div>
            <div className="tl-pbar"><span className="tl-plabel" style={{ left: '18%' }}>Event Management</span></div>
          </div>
        </div>

        <div className="tl-footer">
          <div className="tl-dashed" />
          <div className="tl-anchor" style={{ left: '2%' }}><div className="tl-pin" /><div className="tl-anchor-lbl below">Registration<br />date</div></div>
          <div className="tl-anchor" style={{ left: '41%' }}><div className="tl-pin" /><div className="tl-anchor-lbl">Purchase<br />date</div></div>
          <div className="tl-anchor" style={{ left: '81%' }}><div className="tl-pin" /><div className="tl-anchor-lbl">4 months after<br />last purchase</div></div>
        </div>
      </div>

      <div className="tl-legend">
        <div className="tl-legend-title">Legenda</div>
        <div className="tl-legend-grid">
          <span><Ico type="email" /> Email</span>
          <span><Ico type="task" /> Task</span>
          <span><Ico type="bolt" /> Triggered</span>
          <span><Ico type="mms" /> MMS</span>
          <span><Ico type="wechat" /> Wechat</span>
          <span><Ico type="sms" /> SMS</span>
        </div>
      </div>
    </div>
  );
}
