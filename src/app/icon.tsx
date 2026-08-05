import { ImageResponse } from 'next/og';

import { primaryColor } from 'src/theme/palette';

// ----------------------------------------------------------------------

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: primaryColor,
          borderRadius: 96,
          fontSize: 280,
        }}
      >
        🧋
      </div>
    ),
    { ...size }
  );
}
