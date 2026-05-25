#!/usr/bin/env python3
"""run_security_audit.py

Este script executa duas auditorias sequenciais e gera relatórios separados:

1️⃣ **Scanner de segredos** – usa `gitleaks` para detectar possíveis vazamentos de chaves
   (ex.: API keys, tokens). O output bruto é salvo em `security_audits/gitleaks_report-<timestamp>.txt`.

2️⃣ **Auditoria do SecurityGuard** – importa `core.security_guard.SecurityGuard` e valida
   uma lista de comandos críticos (exemplo interno). O resultado JSON contendo
   comando, status e severidade é salvo em `security_audits/guard_report-<timestamp>.json`.

O script pode ser agendado (Task Scheduler / cron) para rodar a cada 3 horas.
"""

import subprocess
import json
import os
import sys
import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Configurações de diretórios
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[1]  # e:/.../aci-suite
AUDIT_DIR = PROJECT_ROOT / "security_audits"
AUDIT_DIR.mkdir(exist_ok=True)

def timestamp():
    return datetime.datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%SZ")

# ---------------------------------------------------------------------------
# 1️⃣ Scanner de segredos (gitleaks)
# ---------------------------------------------------------------------------
def run_gitleaks():
    out_file = AUDIT_DIR / f"gitleaks_report-{timestamp()}.txt"
    try:
        result = subprocess.run(
            ["gitleaks", "detect", "--source", str(PROJECT_ROOT), "--verbose"],
            capture_output=True,
            text=True,
            check=False,
        )
        out_file.write_text(result.stdout + "\n" + result.stderr)
        return {"status": "ok", "report": str(out_file)}
    except FileNotFoundError:
        return {"status": "error", "message": "gitleaks not installed"}

# ---------------------------------------------------------------------------
# 2️⃣ Auditoria do SecurityGuard
# ---------------------------------------------------------------------------
def run_security_guard_audit():
    # Importando o guard dinamicamente para evitar dependências circulares
    try:
        from core.security_guard import SecurityGuard, SecurityViolation
    except Exception as e:
        return {"status": "error", "message": f"Import error: {e}"}

    guard = SecurityGuard()
    # Lista de comandos de exemplo a validar – pode ser expandida via configuração
    sample_commands = [
        "rm -rf /",               # crítico
        "DELETE FROM users;",    # alto
        "echo 'Hello World'",    # baixo / permitido
        "DROP TABLE orders;",    # crítico
    ]

    report = []
    for cmd in sample_commands:
        try:
            guard.validate(cmd)
            report.append({"command": cmd, "status": "allowed", "severity": "low"})
        except SecurityViolation as sv:
            report.append({"command": cmd, "status": "blocked", "severity": sv.args[0].split(']')[0].strip('[')})
        except Exception as e:
            report.append({"command": cmd, "status": "error", "error": str(e)})

    out_file = AUDIT_DIR / f"guard_report-{timestamp()}.json"
    out_file.write_text(json.dumps({"generatedAt": datetime.datetime.utcnow().isoformat(), "report": report}, indent=2))
    return {"status": "ok", "report": str(out_file)}

# ---------------------------------------------------------------------------
# Execução principal
# ---------------------------------------------------------------------------
def main():
    results = {
        "gitleaks": run_gitleaks(),
        "securityGuard": run_security_guard_audit(),
    }
    # Exibir sumário rápido no console (útil ao rodar manualmente)
    print(json.dumps(results, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())
