import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const resourcePath = searchParams.get('resourcePath');

        if (!resourcePath) {
            return NextResponse.json({ error: 'Missing resourcePath' }, { status: 400 });
        }

        // Build the URL: baseUrl + resourcePath
        const url = `${process.env.HYPERPAY_BASE_URL}${resourcePath}`;
        const params = new URLSearchParams();
        params.append('entityId', process.env.HYPERPAY_ENTITY_ID!);

        const response = await fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.HYPERPAY_ACCESS_TOKEN}`,
            },
        });

        const data = await response.json();

        // HyperPay success result codes pattern
        // 000.000.xxx = Transaction succeeded
        // 000.100.1xx = Transaction succeeded (review required but ok)
        // 000.3xx / 000.6xx = Transaction pending but likely ok
        const successPattern = /^(000\.000\.|000\.100\.1|000\.[36])/;
        const isSuccess = successPattern.test(data.result?.code || '');

        return NextResponse.json({
            success: isSuccess,
            paymentId: data.id,
            amount: data.amount,
            currency: data.currency,
            brand: data.paymentBrand,
            resultCode: data.result?.code,
            resultDescription: data.result?.description,
            error: isSuccess ? null : (data.result?.description || 'Payment was not successful'),
        });
    } catch (error: any) {
        console.error('HyperPay status verification error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
