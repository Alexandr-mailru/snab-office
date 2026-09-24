const gradients: Record<string, string> = {
  office: "linear-gradient(145deg, #1c3a52 0%, #3d6b8a 55%, #c9d6df 100%)",
  stationery: "linear-gradient(145deg, #0b1f33 0%, #245b7a 50%, #f0c27b 100%)",
  art: "linear-gradient(145deg, #5b2c6f 0%, #c0392b 45%, #f4d03f 100%)",
  school: "linear-gradient(145deg, #1a5276 0%, #28b463 60%, #f7dc6f 100%)",
  sweet: "linear-gradient(145deg, #6c3483 0%, #e74c6f 50%, #f5b7b1 100%)",
  tech: "linear-gradient(145deg, #212f3d 0%, #5d6d7e 70%, #aeb6bf 100%)",
  "organizer-blue": "linear-gradient(145deg, #1a5276, #85c1e9)",
  "organizer-green": "linear-gradient(145deg, #196f3d, #82e0aa)",
  powders: "linear-gradient(145deg, #4a235a, #a569bd 40%, #85929e)",
  notebook: "linear-gradient(145deg, #1b4f72, #d4e6f1)",
  backpack: "linear-gradient(145deg, #154360, #5dade2)",
  "dye-red": "linear-gradient(145deg, #7b241c, #e74c3c)",
  sprinkles: "linear-gradient(145deg, #6c3483, #f5b041 50%, #ec7063)",
  paper: "linear-gradient(145deg, #f4f6f7, #aeb6bf)",
  cleaner: "linear-gradient(145deg, #0e6655, #76d7c4)",
  toner: "linear-gradient(145deg, #1c2833, #7f8c8d)",
  pen: "linear-gradient(145deg, #1a5276, #3498db)",
  acrylic: "linear-gradient(145deg, #c0392b, #f4d03f 40%, #2980b9)",
};

export function productGradient(hint?: string | null) {
  if (!hint) return gradients.stationery;
  return gradients[hint] ?? gradients.stationery;
}
