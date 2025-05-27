namespace Dict {
  interface DataVo {
    /** 字典ID */
    id: string;
    /** 父级ID */
    parentId: string;
    /** 字典排序 */
    dictSort: number;
    /** 字典标签 */
    dictLabel: string;
    /** 字典键值 */
    dictValue: string;
    /** 字典类型 */
    dictTypeKey: string;
    /** 样式属性（其他样式扩展） */
    cssClass: string;
    /** 表格回显样式 */
    listClass: string;
    /** 是否默认（Y是 N否） */
    isDefault: string;
    /** 备注 */
    remark: string;
  }
}
