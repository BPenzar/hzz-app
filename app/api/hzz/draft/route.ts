  const buf = await Packer.toBuffer(doc); // Node Buffer
  const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  // Pretvori Buffer -> Uint8Array (ili ArrayBuffer)
  const uint8 = new Uint8Array(buf); 
  // alternativno: const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  return new Response(uint8, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": 'attachment; filename="hzz-nacrt.docx"',
    },
  });
