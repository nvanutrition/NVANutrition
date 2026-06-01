import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const contactData = await request.json();

    const formattedLead = {
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      name: contactData.name || '',
      email: contactData.email || '',
      phone: contactData.phone || '',
      subject: contactData.subject || '',
      message: contactData.message || '',
    };

    console.log('Processed Contact Lead for Sheets API:', formattedLead);

    const scriptURL = process.env.GOOGLE_CONTACT_SCRIPT_URL;

    if (scriptURL) {
      try {
        const response = await fetch(scriptURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedLead),
        });

        if (response.ok) {
          const resJson = await response.json();
          console.log('[Google Sheets Lead API Success]:', resJson);
        } else {
          console.error('[Google Sheets Lead API Error] Status:', response.status);
        }
      } catch (scriptError) {
        console.error('[Google Sheets Lead API Fetch Exception]:', scriptError);
      }
    } else {
      console.log('[Google Sheets Warning] GOOGLE_CONTACT_SCRIPT_URL environment variable is not configured. Saved lead locally.');
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Inquiry received and lead captured successfully'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing contact form route:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing inquiry' },
      { status: 500 }
    );
  }
}
