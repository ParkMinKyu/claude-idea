// Static pricing model (USD/hour unless noted). Pure functions only.
// Numbers are illustrative MVP values, not live AWS prices.

export const HOURS_PER_MONTH = 730;

// EC2 on-demand hourly by instance type (us-east-1 sample).
const EC2_HOURLY = {
  "t3.micro": 0.0104,
  "t3.small": 0.0208,
  "t3.medium": 0.0416,
  "m5.large": 0.096,
  "m5.xlarge": 0.192,
  "m5.2xlarge": 0.384,
  "m5.4xlarge": 0.768,
  "c5.large": 0.085,
};

// RDS on-demand hourly by instance class (single-AZ MySQL sample).
const RDS_HOURLY = {
  "db.t3.micro": 0.017,
  "db.t3.small": 0.034,
  "db.t3.medium": 0.068,
  "db.m5.large": 0.171,
  "db.m5.xlarge": 0.342,
};

// EBS gp3 USD per GB-month.
const EBS_GB_MONTH = { gp3: 0.08, gp2: 0.1, io1: 0.125, st1: 0.045 };

/**
 * Monthly cost for a single resource's attribute values.
 * @returns {{ monthly:number, supported:boolean, basis:string }}
 */
export function monthlyCost(type, values = {}) {
  switch (type) {
    case "aws_instance": {
      const it = values.instance_type;
      const hourly = EC2_HOURLY[it];
      if (hourly == null) return { monthly: 0, supported: false, basis: `unknown instance_type ${it}` };
      const count = values.count ?? 1;
      return { monthly: hourly * HOURS_PER_MONTH * count, supported: true, basis: `${it} x${count}` };
    }
    case "aws_db_instance": {
      const cls = values.instance_class;
      const hourly = RDS_HOURLY[cls];
      if (hourly == null) return { monthly: 0, supported: false, basis: `unknown instance_class ${cls}` };
      const multi = values.multi_az ? 2 : 1;
      const compute = hourly * HOURS_PER_MONTH * multi;
      const storage = (values.allocated_storage ?? 0) * (EBS_GB_MONTH.gp3);
      return { monthly: compute + storage, supported: true, basis: `${cls}${values.multi_az ? " multi-az" : ""}` };
    }
    case "aws_ebs_volume": {
      const vt = values.type ?? "gp3";
      const perGb = EBS_GB_MONTH[vt];
      if (perGb == null) return { monthly: 0, supported: false, basis: `unknown volume type ${vt}` };
      const size = values.size ?? 0;
      return { monthly: perGb * size, supported: true, basis: `${vt} ${size}GB` };
    }
    default:
      return { monthly: 0, supported: false, basis: `unsupported resource ${type}` };
  }
}

export function round2(n) {
  return Math.round(n * 100) / 100;
}
