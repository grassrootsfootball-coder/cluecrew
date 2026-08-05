// Local OCR for the similarity index's image-only papers (Addendum E §3).
//
// macOS Vision text recognition, run entirely on this machine: no network,
// no third-party service, no source text leaving the box. Takes image paths
// and prints recognised text to stdout, where build-similarity-index.ts
// fingerprints it in memory and discards it. Nothing here writes text to disk.
//
// Run: swift scripts/ocr-page.swift <image> [<image> …]

import Foundation
import Vision
import AppKit

let paths = Array(CommandLine.arguments.dropFirst())
if paths.isEmpty {
    FileHandle.standardError.write("usage: ocr-page.swift <image> [<image> …]\n".data(using: .utf8)!)
    exit(1)
}

for path in paths {
    guard let image = NSImage(contentsOfFile: path),
          let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        continue
    }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-GB", "en-US"]

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    do {
        try handler.perform([request])
    } catch {
        continue
    }
    guard let observations = request.results else { continue }
    for observation in observations {
        if let candidate = observation.topCandidates(1).first {
            print(candidate.string)
        }
    }
    print("")
}
