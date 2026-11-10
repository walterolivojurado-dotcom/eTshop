import json
import os

input_file = r'C:\Users\User\.gemini\antigravity\brain\562be539-d6ba-488d-8f2d-64d4291541f9\.system_generated\steps\9\output.txt'
output_file = r'C:\Users\User\Desktop\CalenBaq\backend\updated_workflow.json'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    # The file contains "Retrieved workflow: bedrock-chatwoot-v15-FIXED\n\n{...}"
    json_str = "".join(lines[2:])
    data = json.loads(json_str)

nodes = data['nodes']

# Modify 'Direct Escalation' (id: 0711e99f-d404-4602-8510-9278e7556134)
for node in nodes:
    if node['id'] == '0711e99f-d404-4602-8510-9278e7556134':
        node['parameters']['assignments'] = {
            "assignments": [
                {
                    "id": "asgn-output",
                    "name": "output",
                    "value": "Entendido. He recibido tu requerimiento; en breve serás atendido por uno de nuestros agentes de soporte. [ESCALADO_REQUERIDO]",
                    "type": "string"
                }
            ]
        }
        print("Updated Direct Escalation node")

# Modify 'HTTP Request' (id: dcfacab3-4a9b-44af-b292-92a44cd6286e)
for node in nodes:
    if node['id'] == 'dcfacab3-4a9b-44af-b292-92a44cd6286e':
        node['parameters']['bodyParameters']['parameters'][0]['value'] = '={{ $json["output"] || "⚠️ [DEBUG n8n]: El nodo previo no devolvió un texto. Verifica el flujo." }}'
        print("Updated HTTP Request node")

# Modify 'HTTP Request (Escalation)' (id: 3ef4aa41-9fc3-4d6a-8c0e-6d3e9c2ee25f)
for node in nodes:
    if node['id'] == '3ef4aa41-9fc3-4d6a-8c0e-6d3e9c2ee25f':
        node['parameters']['bodyParameters']['parameters'][0]['value'] = '={{ $json["output"] || "⚠️ [DEBUG n8n]: Error en escalado. El nodo previo no devolvió un texto." }}'
        print("Updated HTTP Request (Escalation) node")

# Modify 'IfEscalate' (id: 8943fb17-a690-40ad-b8cb-14790adfcf7a)
for node in nodes:
    if node['id'] == '8943fb17-a690-40ad-b8cb-14790adfcf7a':
        node['parameters']['conditions']['conditions'][0]['leftValue'] = '={{ $json["output"] }}'
        print("Updated IfEscalate node")

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print(f"Workflow saved to {output_file}")
