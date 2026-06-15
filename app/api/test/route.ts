import { NextResponse } from 'next/server';
import { getInitialCropFromCroppedAreaPercentages } from 'react-easy-crop/helpers.js';

export async function GET() {
  try {
    const res = getInitialCropFromCroppedAreaPercentages(
      {x: 50, y: 50, width: 50, height: 50}, 
      {width: 1000, height: 1000}, 0, {width: 500, height: 500}, 1, 3
    );
    return NextResponse.json({ ok: true, res });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message });
  }
}
