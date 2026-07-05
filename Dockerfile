 {
  "errorMessage": "Bad request - please check your parameters",
  "errorDescription": "Fatal",
  "errorDetails": {
    "rawErrorMessage": [
      "400 - {\"error\":{\"message\":\"Fatal\",\"type\":\"OAuthException\",\"code\":-1,\"error_subcode\":2207082,\"is_transient\":false,\"error_user_title\":\"Video Transcoding Error\",\"error_user_msg\":\"Video Transcoding Error: facebook::videoinfra::um::MediaInfoExtractionException: Subprocess failed: exited with status 1.  stderr: I0611 03:54:38.678714 2527111 ThreadPools.cpp:14] Creating CPU thread pool with name=uma-utils, threads=48\\\\nI0611 03:54:38.678766 2527111 ThreadPools.cpp:28] Creating IO thread pool with name=uma-utils, threads=48\\\\nI0611 03:54:38.678845 2527111 main.cpp:218] Decoding config from base64\\\\nI0611 03:54:38.678861 2527111 main.cpp:50] Processing uri=ffuse://everstore://GKXV1CKCoAJp4AcHACC7NI7ddg8LbgFKAAAP\\\\nE0611 03:54:38.777330 2527111 ParsingContext.cpp:85] Error when parsing : ftyp box not found\\\\nE0611 03:54:38.777354 2527111 ParsingContext.cpp:50] Exception when parsing : mp4utils::ParsingError: moov box not found\\\\nMd5 computation failed with exception: std::runtime_error: Subprocess failed: exited with status 1\\\\nSubprocess stderr: ffprobe version 7.1 Copyright (c) 2007-2024 the FFmpeg developers\\\\n  built with gcc 11.2.1 (GCC)\\\\n  libavutil      59. 39.100 / 59. 39.100\\\\n  libavcodec     61. 19.100 / 61. 19.100\\\\n  libavformat    61.  7.100 / 61.  7.100\\\\n  libavdevice    61.  3.100 / 61.  3.100\\\\n  libavfilter    10.  4.100 / 10.  4.100\\\\n  libswscale      8.  3.100 /  8.  3.100\\\\n  libswresample   5.  3.100 /  5.  3.100\\\\n  libpostproc    58.  3.100 / 58.  3.100\\\\nW0611 03:54:38.706219 2527205 Request.cpp:297] Calling RequestContext::setContextData for videos-rc but it is already set\\\\nI0611 03:54:38.706323 2527205 FfuseContext.cpp:46] [main][0] open: uri=everstore://GKXV1CKCoAJp4AcHACC7NI7ddg8LbgFKAAAP, flags=1, options=(srvPath=/tmp/ffuse.sock, srvAddr=, readSize=8388608, readAhead=8388608, readCacheSize=134217728, writeSize=8388608, noSeek=false, writeMode=default, strict=true), ctx=494EE4CD, mode=READ\\\\nI0611 03:54:38.763738 2527205 FfuseContext.cpp:155] [main][0] EOF reached at 2551\\\\nI0611 03:54:38.763900 2527205 FfuseContext.cpp:155] [main][0] EOF reached at 2551\\\\nI0611 03:54:38.764096 2527205 FfuseContext.cpp:192] [main][0] close: uri=everstore://GKXV1CKCoAJp4AcHACC7NI7ddg8LbgFKAAAP read(count=3, bytes=2551, dur=54ms, rate=0MB/s) \\\\nffuse://everstore://GKXV1CKCoAJp4AcHACC7NI7ddg8LbgFKAAAP: Invalid data found when processing input\\\\n\\\\nSubprocess stdout: {\\\\n\\\\n}\\\\n\\\\nfailed to run ffprobe command on path: ffuse://everstore://GKXV1CKCoAJp4AcHACC7NI7ddg8LbgFKAAAP\\\\nI0611 03:54:38.787205 2527111 main.cpp:293] Exiting with 1 after 109ms \\\\n\",\"fbtrace_id\":\"AG7i8tVwR7AB52PfuLxuOI7\"}}"
    ],
    "httpCode": "400"
  },
  "n8nDetails": {
    "nodeName": "Facebook Graph API1",
    "nodeType": "n8n-nodes-base.facebookGraphApi",
    "nodeVersion": 1,
    "time": "6/11/2026, 4:25:59 PM",
    "n8nVersion": "2.20.8 (Self Hosted)",
    "binaryDataMode": "filesystem",
    "stackTrace": [
      "NodeApiError: Bad request - please check your parameters",
      "    at ExecuteContext.execute (/home/pinto/.local/share/nvm/v22.22.3/lib/node_modules/n8n/node_modules/n8n-nodes-base/nodes/Facebook/FacebookGraphApi.node.ts:439:12)",
      "    at processTicksAndRejections (node:internal/process/task_queues:103:5)",
      "    at WorkflowExecute.executeNode (/home/pinto/.local/share/nvm/v22.22.3/lib/node_modules/n8n/node_modules/n8n-core/src/execution-engine/workflow-execute.ts:1048:9)",
      "    at WorkflowExecute.runNode (/home/pinto/.local/share/nvm/v22.22.3/lib/node_modules/n8n/node_modules/n8n-core/src/execution-engine/workflow-execute.ts:1239:11)",
      "    at /home/pinto/.local/share/nvm/v22.22.3/lib/node_modules/n8n/node_modules/n8n-core/src/execution-engine/workflow-execute.ts:1687:27",
      "    at /home/pinto/.local/share/nvm/v22.22.3/lib/node_modules/n8n/node_modules/n8n-core/src/execution-engine/workflow-execute.ts:2339:11"
    ]
  }
}
