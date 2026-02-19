function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const address = (body.address || "").trim();
    const issue = (body.issue || "").trim();
    const website = (body.website || "autorepair").trim();
    const sessionId = (body.session_id || "").trim();

    if (!name || !phone || !address || !issue) {
      return json({ ok: false, error: "name, phone, address, and issue are required" }, 400);
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      request_id: requestId,
      created_at: new Date().toISOString(),
      website,
      session_id: sessionId,
      name,
      phone,
      address,
      issue,
      source: "website_chat",
    };

    // Preferred storage: KV binding (INTAKE_KV). Fallback: Cloudflare logs.
    if (context.env && context.env.INTAKE_KV) {
      await context.env.INTAKE_KV.put(`intake:${requestId}`, JSON.stringify(record));
    } else {
      console.log("intake_record", record);
    }

    return json({
      ok: true,
      request_id: requestId,
      message: "Request saved successfully",
    });
  } catch (err) {
    return json({
      ok: false,
      error: "Failed to save request",
      details: String(err && err.message ? err.message : err),
    }, 500);
  }
}
