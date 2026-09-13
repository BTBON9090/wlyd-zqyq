/** GB/T 4754-2017 国民经济行业分类（演示数据：四级结构） */

export type IndustryClass = { code: string; name: string };
export type IndustryGroup = { code: string; name: string; classes: IndustryClass[] };
export type IndustryDivision = { code: string; name: string; groups: IndustryGroup[] };
export type IndustrySection = { code: string; name: string; divisions: IndustryDivision[] };

export const industrySections: IndustrySection[] = [
  {
    code: "A",
    name: "农、林、牧、渔业",
    divisions: [
      {
        code: "01",
        name: "农业",
        groups: [
          {
            code: "011",
            name: "谷物种植",
            classes: [
              { code: "0111", name: "稻谷种植" },
              { code: "0112", name: "小麦种植" },
              { code: "0113", name: "玉米种植" },
            ],
          },
        ],
      },
      {
        code: "02",
        name: "林业",
        groups: [
          {
            code: "021",
            name: "林木育种和育苗",
            classes: [{ code: "0211", name: "林木育种" }],
          },
        ],
      },
    ],
  },
  {
    code: "B",
    name: "采矿业",
    divisions: [
      {
        code: "06",
        name: "煤炭开采和洗选业",
        groups: [
          {
            code: "061",
            name: "烟煤和无烟煤开采洗选",
            classes: [{ code: "0610", name: "烟煤和无烟煤开采洗选" }],
          },
        ],
      },
      {
        code: "07",
        name: "石油和天然气开采业",
        groups: [
          {
            code: "071",
            name: "石油开采",
            classes: [{ code: "0711", name: "陆地石油开采" }],
          },
        ],
      },
    ],
  },
  {
    code: "C",
    name: "制造业",
    divisions: [
      {
        code: "13",
        name: "农副食品加工业",
        groups: [
          {
            code: "131",
            name: "谷物磨制",
            classes: [
              { code: "1311", name: "稻谷加工" },
              { code: "1312", name: "小麦加工" },
            ],
          },
        ],
      },
      {
        code: "33",
        name: "金属制品业",
        groups: [
          {
            code: "331",
            name: "结构性金属制品制造",
            classes: [
              { code: "3311", name: "金属结构制造" },
              { code: "3312", name: "金属门窗制造" },
            ],
          },
          {
            code: "332",
            name: "金属工具制造",
            classes: [{ code: "3321", name: "切削工具制造" }],
          },
        ],
      },
      {
        code: "34",
        name: "通用设备制造业",
        groups: [
          {
            code: "341",
            name: "锅炉及原动设备制造",
            classes: [
              { code: "3411", name: "锅炉及辅助设备制造" },
              { code: "3412", name: "内燃机及配件制造" },
            ],
          },
          {
            code: "342",
            name: "金属加工机械制造",
            classes: [
              { code: "3421", name: "金属切削机床制造" },
              { code: "3422", name: "金属成形机床制造" },
            ],
          },
          {
            code: "344",
            name: "泵、阀门、压缩机及类似机械制造",
            classes: [{ code: "3441", name: "泵及真空设备制造" }],
          },
        ],
      },
      {
        code: "35",
        name: "专用设备制造业",
        groups: [
          {
            code: "351",
            name: "采矿、冶金、建筑专用设备制造",
            classes: [
              { code: "3511", name: "矿山机械制造" },
              { code: "3512", name: "石油钻采专用设备制造" },
            ],
          },
          {
            code: "352",
            name: "化工、木材、非金属加工专用设备制造",
            classes: [{ code: "3521", name: "炼油、化工生产专用设备制造" }],
          },
        ],
      },
      {
        code: "36",
        name: "汽车制造业",
        groups: [
          {
            code: "361",
            name: "汽车整车制造",
            classes: [
              { code: "3611", name: "汽柴油车整车制造" },
              { code: "3612", name: "新能源车整车制造" },
            ],
          },
          {
            code: "367",
            name: "汽车零部件及配件制造",
            classes: [{ code: "3670", name: "汽车零部件及配件制造" }],
          },
        ],
      },
      {
        code: "37",
        name: "铁路、船舶、航空航天和其他运输设备制造业",
        groups: [
          {
            code: "371",
            name: "铁路运输设备制造",
            classes: [{ code: "3711", name: "铁路机车车辆制造" }],
          },
          {
            code: "373",
            name: "船舶及相关装置制造",
            classes: [{ code: "3731", name: "金属船舶制造" }],
          },
        ],
      },
      {
        code: "38",
        name: "电气机械和器材制造业",
        groups: [
          {
            code: "381",
            name: "电机制造",
            classes: [
              { code: "3811", name: "发电机及发电机组制造" },
              { code: "3812", name: "电动机制造" },
            ],
          },
          {
            code: "382",
            name: "输配电及控制设备制造",
            classes: [{ code: "3821", name: "变压器、整流器和电感器制造" }],
          },
        ],
      },
      {
        code: "39",
        name: "计算机、通信和其他电子设备制造业",
        groups: [
          {
            code: "391",
            name: "计算机制造",
            classes: [{ code: "3911", name: "计算机整机制造" }],
          },
          {
            code: "392",
            name: "通信设备制造",
            classes: [{ code: "3921", name: "通信系统设备制造" }],
          },
        ],
      },
      {
        code: "40",
        name: "仪器仪表制造业",
        groups: [
          {
            code: "401",
            name: "通用仪器仪表制造",
            classes: [
              { code: "4011", name: "工业自动控制系统装置制造" },
              { code: "4012", name: "电工仪器仪表制造" },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "D",
    name: "电力、热力、燃气及水生产和供应业",
    divisions: [
      {
        code: "44",
        name: "电力、热力生产和供应业",
        groups: [
          {
            code: "441",
            name: "电力生产",
            classes: [{ code: "4411", name: "火力发电" }],
          },
        ],
      },
    ],
  },
  {
    code: "E",
    name: "建筑业",
    divisions: [
      {
        code: "47",
        name: "房屋建筑业",
        groups: [
          {
            code: "471",
            name: "住宅房屋建筑",
            classes: [{ code: "4710", name: "住宅房屋建筑" }],
          },
        ],
      },
    ],
  },
  {
    code: "F",
    name: "批发和零售业",
    divisions: [
      {
        code: "51",
        name: "批发业",
        groups: [
          {
            code: "517",
            name: "机械设备、五金产品及电子产品批发",
            classes: [{ code: "5172", name: "汽车及零配件批发" }],
          },
        ],
      },
    ],
  },
  {
    code: "G",
    name: "交通运输、仓储和邮政业",
    divisions: [
      {
        code: "54",
        name: "道路运输业",
        groups: [
          {
            code: "543",
            name: "道路货物运输",
            classes: [{ code: "5430", name: "道路货物运输" }],
          },
        ],
      },
    ],
  },
  {
    code: "H",
    name: "住宿和餐饮业",
    divisions: [
      {
        code: "61",
        name: "住宿业",
        groups: [
          {
            code: "611",
            name: "旅游饭店",
            classes: [{ code: "6110", name: "旅游饭店" }],
          },
        ],
      },
    ],
  },
  {
    code: "I",
    name: "信息传输、软件和信息技术服务业",
    divisions: [
      {
        code: "64",
        name: "互联网和相关服务",
        groups: [
          {
            code: "642",
            name: "互联网信息服务",
            classes: [{ code: "6420", name: "互联网信息服务" }],
          },
        ],
      },
      {
        code: "65",
        name: "软件和信息技术服务业",
        groups: [
          {
            code: "651",
            name: "软件开发",
            classes: [
              { code: "6511", name: "基础软件开发" },
              { code: "6512", name: "支撑软件开发" },
              { code: "6513", name: "应用软件开发" },
            ],
          },
        ],
      },
    ],
  },
  {
    code: "J",
    name: "金融业",
    divisions: [
      {
        code: "66",
        name: "货币金融服务",
        groups: [
          {
            code: "662",
            name: "货币银行服务",
            classes: [{ code: "6621", name: "商业银行服务" }],
          },
        ],
      },
    ],
  },
  {
    code: "K",
    name: "房地产业",
    divisions: [
      {
        code: "70",
        name: "房地产业",
        groups: [
          {
            code: "701",
            name: "房地产开发经营",
            classes: [{ code: "7010", name: "房地产开发经营" }],
          },
        ],
      },
    ],
  },
  {
    code: "L",
    name: "租赁和商务服务业",
    divisions: [
      {
        code: "72",
        name: "商务服务业",
        groups: [
          {
            code: "721",
            name: "组织管理服务",
            classes: [{ code: "7211", name: "企业总部管理" }],
          },
        ],
      },
    ],
  },
  {
    code: "M",
    name: "科学研究和技术服务业",
    divisions: [
      {
        code: "73",
        name: "研究和试验发展",
        groups: [
          {
            code: "732",
            name: "工程和技术研究和试验发展",
            classes: [{ code: "7320", name: "工程和技术研究和试验发展" }],
          },
        ],
      },
    ],
  },
  {
    code: "N",
    name: "水利、环境和公共设施管理业",
    divisions: [
      {
        code: "77",
        name: "生态保护和环境治理业",
        groups: [
          {
            code: "772",
            name: "环境治理业",
            classes: [{ code: "7721", name: "水污染治理" }],
          },
        ],
      },
    ],
  },
  {
    code: "O",
    name: "居民服务、修理和其他服务业",
    divisions: [
      {
        code: "80",
        name: "居民服务业",
        groups: [
          {
            code: "801",
            name: "家庭服务",
            classes: [{ code: "8010", name: "家庭服务" }],
          },
        ],
      },
    ],
  },
  {
    code: "P",
    name: "教育",
    divisions: [
      {
        code: "83",
        name: "教育",
        groups: [
          {
            code: "833",
            name: "中等教育",
            classes: [{ code: "8331", name: "普通初中教育" }],
          },
        ],
      },
    ],
  },
  {
    code: "Q",
    name: "卫生和社会工作",
    divisions: [
      {
        code: "84",
        name: "卫生",
        groups: [
          {
            code: "841",
            name: "医院",
            classes: [{ code: "8411", name: "综合医院" }],
          },
        ],
      },
    ],
  },
  {
    code: "R",
    name: "文化、体育和娱乐业",
    divisions: [
      {
        code: "86",
        name: "新闻和出版业",
        groups: [
          {
            code: "862",
            name: "出版业",
            classes: [{ code: "8621", name: "图书出版" }],
          },
        ],
      },
    ],
  },
  {
    code: "S",
    name: "公共管理、社会保障和社会组织",
    divisions: [
      {
        code: "91",
        name: "国家机构",
        groups: [
          {
            code: "911",
            name: "国家权力机构",
            classes: [{ code: "9110", name: "国家权力机构" }],
          },
        ],
      },
    ],
  },
  {
    code: "T",
    name: "国际组织",
    divisions: [
      {
        code: "96",
        name: "国际组织",
        groups: [
          {
            code: "960",
            name: "国际组织",
            classes: [{ code: "9600", name: "国际组织" }],
          },
        ],
      },
    ],
  },
];

export type IndustrySelection = {
  section: string;
  division: string;
  group: string;
  class: string;
};

export const emptyIndustrySelection = (): IndustrySelection => ({
  section: "",
  division: "",
  group: "",
  class: "",
});

export function getIndustrySection(code: string) {
  return industrySections.find((s) => s.code === code);
}

export function getIndustryDivisions(sectionCode: string) {
  return getIndustrySection(sectionCode)?.divisions ?? [];
}

export function getIndustryDivision(sectionCode: string, divisionCode: string) {
  return getIndustryDivisions(sectionCode).find((d) => d.code === divisionCode);
}

export function getIndustryGroups(sectionCode: string, divisionCode: string) {
  return getIndustryDivision(sectionCode, divisionCode)?.groups ?? [];
}

export function getIndustryGroup(sectionCode: string, divisionCode: string, groupCode: string) {
  return getIndustryGroups(sectionCode, divisionCode).find((g) => g.code === groupCode);
}

export function getIndustryClasses(sectionCode: string, divisionCode: string, groupCode: string) {
  return getIndustryGroup(sectionCode, divisionCode, groupCode)?.classes ?? [];
}

export function getIndustryClass(
  sectionCode: string,
  divisionCode: string,
  groupCode: string,
  classCode: string,
) {
  return getIndustryClasses(sectionCode, divisionCode, groupCode).find((c) => c.code === classCode);
}

export function isIndustryComplete(sel: IndustrySelection) {
  return !!(sel.section && sel.division && sel.group && sel.class);
}

export function formatIndustrySelection(sel: IndustrySelection) {
  const section = getIndustrySection(sel.section);
  const division = getIndustryDivision(sel.section, sel.division);
  const group = getIndustryGroup(sel.section, sel.division, sel.group);
  const cls = getIndustryClass(sel.section, sel.division, sel.group, sel.class);
  if (!section || !division || !group || !cls) return "";
  return `${section.code} ${section.name} / ${division.code} ${division.name} / ${group.code} ${group.name} / ${cls.code} ${cls.name}`;
}

export function formatIndustrySelectionShort(sel: IndustrySelection) {
  const cls = getIndustryClass(sel.section, sel.division, sel.group, sel.class);
  return cls ? `${sel.class} ${cls.name}` : "";
}

export function parseIndustryApplication(value?: string): IndustrySelection {
  const empty = emptyIndustrySelection();
  if (!value?.trim()) return empty;

  const parts = value.split(" / ").map((p) => p.trim());
  if (parts.length >= 4) {
    return {
      section: parts[0].split(/\s+/)[0] ?? "",
      division: parts[1].split(/\s+/)[0] ?? "",
      group: parts[2].split(/\s+/)[0] ?? "",
      class: parts[3].split(/\s+/)[0] ?? "",
    };
  }

  if (parts.length >= 2) {
    const sectionCode = parts[0].split(/\s+/)[0] ?? "";
    const divisionName = parts[1];
    const section = getIndustrySection(sectionCode);
    const division = section?.divisions.find(
      (d) => d.name === divisionName || divisionName.includes(d.name) || d.name.includes(divisionName),
    );
    if (division) {
      const group = division.groups[0];
      const cls = group?.classes[0];
      return {
        section: sectionCode,
        division: division.code,
        group: group?.code ?? "",
        class: cls?.code ?? "",
      };
    }
  }

  return empty;
}
