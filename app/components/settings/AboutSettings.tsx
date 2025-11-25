import React from 'react';

export const AboutSettings: React.FC = () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    return (
        <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                情報
            </h2>
            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>ライセンス</h3>
                <p>このアプリは <a href={`${basePath}/license`} target="_blank" rel="noopener noreferrer">ISC ライセンス</a> の下で配布されています。</p>
            </section>
            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>クレジット</h3>
                <p>デフォルトVRMモデル（Noa.vrm）は、VRoid Studio のサンプルモデル（AvatarSample_O）の髪型を使用し、その他を改変して作成されたものです。</p>
                <p>VRoid Studio のサンプルモデルは <a href="https://vroid.com" target="_blank" rel="noopener noreferrer">VRoid Hub</a> で提供されています。</p>
            </section>
            <section>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>リポジトリ</h3>
                <p>ソースコードは <a href="https://github.com/naolab/vrm-asmr" target="_blank" rel="noopener noreferrer">GitHub</a> で公開されています。</p>
            </section>
        </div>
    );
};
