type RouteMetric = {
    calls: number;
    success: number;
    errors: number;
    totalMs: number;
};

class MetricsService {
    private routes = new Map<string, RouteMetric>();

    record(routeKey: string, statusCode: number, durationMs: number) {
        const current = this.routes.get(routeKey) || {
            calls: 0,
            success: 0,
            errors: 0,
            totalMs: 0,
        };
        current.calls += 1;
        current.totalMs += durationMs;
        if (statusCode >= 400) current.errors += 1;
        else current.success += 1;
        this.routes.set(routeKey, current);
    }

    snapshot() {
        const byRoute = Array.from(this.routes.entries()).map(([route, metric]) => ({
            route,
            calls: metric.calls,
            success: metric.success,
            errors: metric.errors,
            avgMs: metric.calls > 0 ? Number((metric.totalMs / metric.calls).toFixed(2)) : 0,
        }));
        const totals = byRoute.reduce(
            (acc, row) => {
                acc.calls += row.calls;
                acc.success += row.success;
                acc.errors += row.errors;
                return acc;
            },
            { calls: 0, success: 0, errors: 0 }
        );
        return { totals, byRoute };
    }
}

export const metricsService = new MetricsService();
